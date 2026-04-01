const { z } = require('zod');
const roundRepository = require('../repositories/roundRepository');
const simulationService = require('../services/simulationService');
const asyncHandler = require('../utils/asyncHandler');

const createSchema = z.object({
  number: z.int('Número deve ser um inteiro').positive('Número deve ser positivo'),
  startDate: z.coerce.date({ message: 'startDate inválida' }),
  endDate: z.coerce.date({ message: 'endDate inválida' }),
});

async function listRounds(req, res) {
  const rounds = await roundRepository.findAll();
  return res.status(200).json(rounds);
}

async function getRound(req, res) {
  const { id } = req.params;

  const round = await roundRepository.findById(id);
  if (!round) {
    return res.status(404).json({ message: 'Rodada não encontrada' });
  }

  return res.status(200).json({
    ...round,
    submittedConfigsCount: round._count.roundConfigs,
    submittedStoreIds: round.roundConfigs.map((rc) => rc.storeId),
    _count: undefined,
    roundConfigs: undefined,
  });
}

async function createRound(req, res) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
  }

  const active = await roundRepository.findActive();
  if (active) {
    return res.status(409).json({ message: 'Encerre a rodada atual antes de criar uma nova' });
  }

  const round = await roundRepository.create({ ...parsed.data, status: 'OPEN' });
  return res.status(201).json(round);
}

async function closeRound(req, res) {
  const { id } = req.params;

  const round = await roundRepository.findById(id);
  if (!round) {
    return res.status(404).json({ message: 'Rodada não encontrada' });
  }

  if (round.status !== 'OPEN') {
    return res.status(409).json({
      message: `Rodada não pode ser encerrada pois está com status "${round.status}"`,
    });
  }

  await roundRepository.updateStatus(id, 'PROCESSING');

  await simulationService.processRound(id);

  await roundRepository.updateStatus(id, 'CLOSED');

  return res.status(200).json({ message: 'Rodada encerrada e resultados calculados' });
}

module.exports = {
  listRounds: asyncHandler(listRounds),
  getRound: asyncHandler(getRound),
  createRound: asyncHandler(createRound),
  closeRound: asyncHandler(closeRound),
};
