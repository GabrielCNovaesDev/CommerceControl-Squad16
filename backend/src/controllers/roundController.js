const { z } = require('zod');
const prisma = require('../utils/prisma');
const roundRepository = require('../repositories/roundRepository');
const simulationService = require('../services/simulationService');
const asyncHandler = require('../utils/asyncHandler');

const createSchema = z.object({
  number: z.number().int('Número deve ser um inteiro').positive('Número deve ser positivo'),
  durationHours: z.number().int('Duração deve ser um inteiro').positive('Duração deve ser positiva').default(1),
  demandFactor: z.number().min(0, 'Fator de demanda não pode ser negativo').max(1, 'Fator de demanda máximo é 1').default(0.5),
});

async function listRounds(req, res) {
  const rounds = await roundRepository.findAll();
  return res.status(200).json(
    rounds.map((r) => ({
      ...r,
      submittedConfigsCount: r._count.roundConfigs,
      _count: undefined,
    }))
  );
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

  const now = new Date();
  const endsAt = new Date(now.getTime() + parsed.data.durationHours * 60 * 60 * 1000);

  const round = await roundRepository.create({
    number: parsed.data.number,
    durationHours: parsed.data.durationHours,
    demandFactor: parsed.data.demandFactor,
    endsAt,
    status: 'OPEN',
  });

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

  try {
    await simulationService.processRound(id);
  } catch (err) {
    await roundRepository.updateStatus(id, 'OPEN');
    throw err;
  }

  await roundRepository.updateStatus(id, 'CLOSED');

  return res.status(200).json({ message: 'Rodada encerrada e resultados calculados' });
}

// ── Feature 4: Delete last round ──────────────────────────────────────────────
async function deleteLastRound(req, res) {
  // Find the last round by number
  const lastRound = await prisma.round.findFirst({ orderBy: { number: 'desc' } });
  if (!lastRound) {
    return res.status(404).json({ message: 'Nenhuma rodada encontrada' });
  }

  if (lastRound.status === 'PROCESSING') {
    return res.status(409).json({ message: 'Não é possível excluir uma rodada em processamento' });
  }

  await prisma.$transaction(async (tx) => {
    // If CLOSED, reverse inventory decrements by re-adding sold volumes
    if (lastRound.status === 'CLOSED') {
      const configs = await tx.roundConfig.findMany({
        where: { roundId: lastRound.id },
        include: { roundConfigItems: true, financialResult: true },
      });

      // For each config, re-add the sold quantities from the financial result
      // We track sold per product via item breakdown stored in roundConfigItems salesVolume
      // Best approach: re-add salesVolume capped to what was actually sold (effectiveVolume)
      // Since we don't store effectiveVolume, we restore salesVolume as proxy
      for (const config of configs) {
        for (const item of config.roundConfigItems) {
          await tx.inventory.upsert({
            where: { storeId_productId: { storeId: config.storeId, productId: item.productId } },
            create: { storeId: config.storeId, productId: item.productId, quantity: item.salesVolume },
            update: { quantity: { increment: item.salesVolume } },
          });
        }
      }

      // Delete financial results
      await tx.financialResult.deleteMany({ where: { roundId: lastRound.id } });
    }

    // Delete round config items → configs → round
    const configIds = await tx.roundConfig
      .findMany({ where: { roundId: lastRound.id }, select: { id: true } })
      .then((rows) => rows.map((r) => r.id));

    if (configIds.length > 0) {
      await tx.roundConfigItem.deleteMany({ where: { roundConfigId: { in: configIds } } });
    }
    await tx.roundConfig.deleteMany({ where: { roundId: lastRound.id } });
    await tx.round.delete({ where: { id: lastRound.id } });
  });

  return res.status(200).json({ message: `Rodada #${lastRound.number} excluída com sucesso` });
}

// ── Feature 4: Reset game ─────────────────────────────────────────────────────
async function resetGame(req, res) {
  await prisma.$transaction(async (tx) => {
    // Delete all financial results
    await tx.financialResult.deleteMany({});

    // Delete all round config items and configs
    await tx.roundConfigItem.deleteMany({});
    await tx.roundConfig.deleteMany({});

    // Delete all rounds
    await tx.round.deleteMany({});

    // Reset all stores: currentCash = initialCapital, zero inventory
    const stores = await tx.store.findMany();
    for (const store of stores) {
      await tx.store.update({
        where: { id: store.id },
        data: { currentCash: store.initialCapital },
      });
    }

    // Zero out all inventory
    await tx.inventory.updateMany({ data: { quantity: 0 } });
  });

  return res.status(200).json({ message: 'Jogo reiniciado com sucesso. Todas as rodadas foram excluídas.' });
}

module.exports = {
  listRounds: asyncHandler(listRounds),
  getRound: asyncHandler(getRound),
  createRound: asyncHandler(createRound),
  closeRound: asyncHandler(closeRound),
  deleteLastRound: asyncHandler(deleteLastRound),
  resetGame: asyncHandler(resetGame),
};
