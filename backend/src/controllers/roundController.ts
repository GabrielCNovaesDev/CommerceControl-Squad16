import { z } from 'zod';
import { Request, Response } from 'express';
import roundRepository from '../repositories/roundRepository';
import storeRepository from '../repositories/storeRepository';
import * as simulationService from '../services/simulationService';
import * as roundService from '../services/roundService';
import asyncHandler from '../utils/asyncHandler';
import { sendError } from '../utils/errorResponse';
import { parsePagination, paginate } from '../utils/pagination';
import prisma from '../utils/prisma';
import type { Round } from '@prisma/client';

const createSchema = z.object({
  number: z.number().int('Número deve ser um inteiro').positive('Número deve ser positivo'),
  durationHours: z.number().int('Duração deve ser um inteiro').positive('Duração deve ser positiva').default(1),
  demandFactor: z.number().min(0, 'Fator de demanda não pode ser negativo').max(1, 'Fator de demanda máximo é 1').default(0.5),
});

const extendSchema = z.object({
  additionalMinutes: z.number().int('Deve ser inteiro').positive('Deve ser positivo'),
});

async function listRounds(req: Request, res: Response): Promise<void> {
  const params = parsePagination(req);
  const [rounds, totalElements] = await roundRepository.findPaginated(params.skip, params.size);
  res.status(200).json(
    paginate(
      rounds.map((r: Round) => ({
        ...r,
        submittedConfigsCount: r._count.roundConfigs,
        _count: undefined,
      })),
      totalElements,
      params
    )
  );
}

async function getRound(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);

  const round = await roundRepository.findById(id);
  if (!round) {
    sendError(res, 404, 'ROUND_NOT_FOUND', 'Rodada não encontrada');
    return;
  }

  res.status(200).json({
    ...round,
    submittedConfigsCount: round._count.roundConfigs,
    submittedStoreIds: round.roundConfigs.map((rc: { storeId: string }) => rc.storeId),
    _count: undefined,
    roundConfigs: undefined,
  });
}

async function createRound(req: Request, res: Response): Promise<void> {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Dados inválidos', parsed.error.flatten().fieldErrors);
    return;
  }

  const active = await roundRepository.findActive();
  if (active) {
    sendError(res, 409, 'ROUND_ALREADY_OPEN', 'Encerre a rodada atual antes de criar uma nova');
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
  const id = String(req.params.id);

  const round = await roundRepository.findById(id);
  if (!round) {
    sendError(res, 404, 'ROUND_NOT_FOUND', 'Rodada não encontrada');
    return;
  }

  if (round.status !== 'OPEN') {
    sendError(res, 409, 'ROUND_NOT_OPEN', `Rodada não pode ser encerrada pois está com status "${round.status}"`);
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
  try {
    const { roundNumber } = await roundService.deleteLastRound();
    res.status(200).json({ message: `Rodada #${roundNumber} excluída com sucesso` });
  } catch (err) {
    const e = err as { statusCode?: number; code?: string; message: string };
    if (e.statusCode && e.code) {
      sendError(res, e.statusCode, e.code, e.message);
      return;
    }
    throw err;
  }
}

async function resetGame(req: Request, res: Response): Promise<void> {
  await roundService.resetGame();
  res.status(200).json({ message: 'Jogo reiniciado com sucesso. Todas as rodadas foram excluídas.' });
}

async function extendRound(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);

  const parsed = extendSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Dados inválidos', parsed.error.flatten().fieldErrors);
    return;
  }

  const round = await roundRepository.findById(id);
  if (!round) {
    sendError(res, 404, 'ROUND_NOT_FOUND', 'Rodada não encontrada');
    return;
  }

  if (round.status !== 'OPEN') {
    sendError(res, 409, 'ROUND_NOT_OPEN', 'Só é possível adicionar tempo a uma rodada aberta');
    return;
  }

  const baseTime = Math.max(new Date(round.endsAt).getTime(), Date.now());
  const newEndsAt = new Date(baseTime + parsed.data.additionalMinutes * 60 * 1000);

  await roundRepository.updateEndsAt(id, newEndsAt);

  res.status(200).json({ message: `Tempo adicionado: +${parsed.data.additionalMinutes} minutos`, endsAt: newEndsAt.toISOString() });
}

async function getRoundEvents(req: Request, res: Response): Promise<void> {
  const roundId = String(req.params.id);
  const { role, squadId } = req.user!;

  const round = await roundRepository.findById(roundId);
  if (!round) {
    sendError(res, 404, 'ROUND_NOT_FOUND', 'Rodada não encontrada');
    return;
  }

  // Players can only see events for their own store
  if (role === 'PLAYER') {
    if (!squadId) {
      sendError(res, 400, 'NO_SQUAD', 'Usuário não pertence a um squad');
      return;
    }
    const store = await storeRepository.findBySquadId(squadId);
    if (!store) {
      sendError(res, 400, 'NO_STORE', 'Seu squad não possui uma loja cadastrada');
      return;
    }
    const events = await prisma.roundEvent.findMany({
      where: { roundId, storeId: store.id },
      orderBy: { createdAt: 'asc' },
    });
    res.status(200).json(events);
    return;
  }

  // Game Master sees all events
  const events = await prisma.roundEvent.findMany({
    where: { roundId },
    include: { store: { select: { id: true, name: true, squad: { select: { name: true } } } } },
    orderBy: { createdAt: 'asc' },
  });
  res.status(200).json(events);
}

export default {
  listRounds: asyncHandler(listRounds),
  getRound: asyncHandler(getRound),
  createRound: asyncHandler(createRound),
  closeRound: asyncHandler(closeRound),
  deleteLastRound: asyncHandler(deleteLastRound),
  resetGame: asyncHandler(resetGame),
  extendRound: asyncHandler(extendRound),
  getRoundEvents: asyncHandler(getRoundEvents),
};
