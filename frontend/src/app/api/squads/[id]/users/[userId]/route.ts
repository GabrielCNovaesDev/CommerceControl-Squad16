import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiHandler } from '@/lib/apiAuth';
import prisma from '@/lib/prisma';

// DELETE /squads/[id]/users/[userId]
export const DELETE = withApiHandler(async (_request: NextRequest, ctx: { params: Promise<{ id: string; userId: string }> }) => {
  await requireRole(['GAME_MASTER']);
  const { id: squadId, userId } = await ctx.params;

  // Regra de negócio: líder não pode ser removido do squad sem transferir a liderança
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'Usuário não encontrado');
  }
  if (user.leader && user.squadId === squadId) {
    throw new ApiError(409, 'USER_IS_LEADER', 'Transfira a liderança antes de remover este usuário do squad');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { squadId: null },
  });
  return NextResponse.json({ data: updated, message: 'Usuário removido do squad' });
});
