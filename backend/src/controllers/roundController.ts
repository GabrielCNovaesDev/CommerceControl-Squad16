import { z } from 'zod';
import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import roundRepository from '../repositories/roundRepository';
import simulationService from '../services/simulationService';
import asyncHandler from '../utils/asyncHandler';

const createSchema = z.object({
  number: z.number().int('Número deve ser um inteiro').positive('Número deve ser positivo'),
  durationHours: z.number().int('Duração deve ser um inteiro').positive('Duração deve ser positiva').default(1),
  demandFactor: z.number().min(0, 'Fator de demanda não pode ser negativo').max(1, 'Fator de demanda máximo é 1').default(0.5),
});

async function listRounds(req: Request, res: Response): Promise<void> {
  const rounds = await roundRepository.findAll();
  res.status(200).json(
    rounds.map((r) => ({
      ...r,
      submittedConfigsCount: r._count.roundConfigs,
      _count: undefined,
    }))
  );
}

async function getRound(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const round = await roundRepository.findById(id);
  if (!round) {
    res.status(404).json({ message: 'Rodada não encontrada' });
    return;
  }

  res.status(200).json({
    ...round,
    submittedConfigsCount: round._count.roundConfigs,
    submittedStoreIds: round.roundConfigs.map((rc) => rc.storeId),
    _count: undefined,
    roundConfigs: undefined,
  });
}

async function createRound(req: Request, res: Response): Promise<void> {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    return;
  }

  const active = await roundRepository.findActive();
  if (active) {
    res.status(409).json({ message: 'Encerre a rodada atual antes de criar uma nova' });
    return;
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

  res.status(201).json(round);
}

async function closeRound(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const round = await roundRepository.findById(id);
  if (!round) {
    res.status(404).json({ message: 'Rodada não encontrada' });
    return;
  }

  if (round.status !== 'OPEN') {
    res.status(409).json({
      message: `Rodada não pode ser encerrada pois está com status "${round.status}"`,
    });
    return;
  }

  await roundRepository.updateStatus(id, 'PROCESSING');

  try {
    await simulationService.processRound(id);
  } catch (err) {
    await roundRepository.updateStatus(id, 'OPEN');
    throw err;
  }

  await roundRepository.updateStatus(id, 'CLOSED');

  res.status(200).json({ message: 'Rodada encerrada e resultados calculados' });
}

async function deleteLastRound(req: Request, res: Response): Promise<void> {
  const lastRound = await prisma.round.findFirst({ orderBy: { number: 'desc' } });
  if (!lastRound) {
    res.status(404).json({ message: 'Nenhuma rodada encontrada' });
    return;
  }

  if (lastRound.status === 'PROCESSING') {
    res.status(409).json({ message: 'Não é possível excluir uma rodada em processamento' });
    return;
  }

  await prisma.$transaction(async (tx) => {
    if (lastRound.status === 'CLOSED') {
      const configs = await tx.roundConfig.findMany({
        where: { roundId: lastRound.id },
        include: { roundConfigItems: true, financialResult: true },
      });

      for (const config of configs) {
        for (const item of config.roundConfigItems) {
          await tx.inventory.upsert({
            where: { storeId_productId: { storeId: config.storeId, productId: item.productId } },
            create: { storeId: config.storeId, productId: item.productId, quantity: item.salesVolume },
            update: { quantity: { increment: item.salesVolume } },
          });
        }
      }

      await tx.financialResult.deleteMany({ where: { roundId: lastRound.id } });
    }

    const configIds = await tx.roundConfig
      .findMany({ where: { roundId: lastRound.id }, select: { id: true } })
      .then((rows) => rows.map((r) => r.id));

    if (configIds.length > 0) {
      await tx.roundConfigItem.deleteMany({ where: { roundConfigId: { in: configIds } } });
    }
    await tx.roundConfig.deleteMany({ where: { roundId: lastRound.id } });
    await tx.round.delete({ where: { id: lastRound.id } });
  });

  res.status(200).json({ message: `Rodada #${lastRound.number} excluída com sucesso` });
}

async function resetGame(req: Request, res: Response): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.financialResult.deleteMany({});
    await tx.roundConfigItem.deleteMany({});
    await tx.roundConfig.deleteMany({});
    await tx.round.deleteMany({});

    const stores = await tx.store.findMany();
    for (const store of stores) {
      await tx.store.update({
        where: { id: store.id },
        data: { currentCash: store.initialCapital },
      });
    }

    await tx.inventory.updateMany({ data: { quantity: 0 } });
  });

  res.status(200).json({ message: 'Jogo reiniciado com sucesso. Todas as rodadas foram excluídas.' });
}

export default {
  listRounds: asyncHandler(listRounds),
  getRound: asyncHandler(getRound),
  createRound: asyncHandler(createRound),
  closeRound: asyncHandler(closeRound),
  deleteLastRound: asyncHandler(deleteLastRound),
  resetGame: asyncHandler(resetGame),
};
