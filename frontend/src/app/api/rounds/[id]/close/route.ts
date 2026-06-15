import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiHandler } from '@/lib/apiAuth';
import prisma from '@/lib/prisma';

// PATCH /rounds/[id]/close
export const PATCH = withApiHandler(async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole(['GAME_MASTER']);
  const { id } = await ctx.params;

  const round = await prisma.round.findUnique({ where: { id } });
  if (!round) {
    throw new ApiError(404, 'ROUND_NOT_FOUND', 'Rodada não encontrada');
  }
  if (round.status !== 'OPEN') {
    throw new ApiError(409, 'ROUND_NOT_OPEN', `Rodada não pode ser encerrada pois está com status "${round.status}"`);
  }

  // Marca como CLOSED. Cálculo de DRE/ranking fica em hooks/processos separados.
  const updated = await prisma.round.update({ where: { id }, data: { status: 'CLOSED' } });
  return NextResponse.json({ data: updated, message: 'Rodada encerrada' });
});
