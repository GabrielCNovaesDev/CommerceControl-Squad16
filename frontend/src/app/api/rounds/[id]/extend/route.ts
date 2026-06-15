import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiHandler } from '@/lib/apiAuth';
import { extendRoundSchema } from '@/lib/validators/rounds';
import prisma from '@/lib/prisma';

// PATCH /rounds/[id]/extend
export const PATCH = withApiHandler(async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole(['GAME_MASTER']);
  const { id } = await ctx.params;
  const body = await request.json();

  const parsed = extendRoundSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Dados inválidos', parsed.error.flatten().fieldErrors);
  }
  const { additionalMinutes } = parsed.data;

  const round = await prisma.round.findUnique({ where: { id } });
  if (!round) {
    throw new ApiError(404, 'ROUND_NOT_FOUND', 'Rodada não encontrada');
  }
  if (round.status !== 'OPEN') {
    throw new ApiError(409, 'ROUND_NOT_OPEN', 'Só é possível adicionar tempo a uma rodada aberta');
  }

  // Nunca reduz tempo: estende a partir do MAIOR entre endsAt e agora
  const baseTime = Math.max(round.endsAt.getTime(), Date.now());
  const newEndsAt = new Date(baseTime + additionalMinutes * 60 * 1000);

  const updated = await prisma.round.update({ where: { id }, data: { endsAt: newEndsAt } });
  return NextResponse.json({
    data: updated,
    message: `Tempo adicionado: +${additionalMinutes} minutos`,
    endsAt: newEndsAt.toISOString(),
  });
});
