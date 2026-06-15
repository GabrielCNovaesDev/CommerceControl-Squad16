import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiHandler } from '@/lib/apiAuth';
import prisma from '@/lib/prisma';

// DELETE /rounds/last
export const DELETE = withApiHandler(async (_request: NextRequest) => {
  await requireRole(['GAME_MASTER']);

  const lastRound = await prisma.round.findFirst({ orderBy: { number: 'desc' } });
  if (!lastRound) {
    throw new ApiError(404, 'NO_ROUNDS', 'Nenhuma rodada para deletar');
  }

  // Cascata manual: garante limpeza de FKs órfãs
  await prisma.$transaction([
    prisma.financialResult.deleteMany({ where: { roundId: lastRound.id } }),
    prisma.roundConfigItem.deleteMany({ where: { roundConfig: { roundId: lastRound.id } } }),
    prisma.roundConfig.deleteMany({ where: { roundId: lastRound.id } }),
    prisma.roundEvent.deleteMany({ where: { roundId: lastRound.id } }),
    prisma.round.delete({ where: { id: lastRound.id } }),
  ]);

  return NextResponse.json({ message: `Rodada #${lastRound.number} deletada com sucesso`, data: { number: lastRound.number } });
});
