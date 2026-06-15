import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiHandler } from '@/lib/apiAuth';
import { addUserToSquadSchema } from '@/lib/validators/squads';
import prisma from '@/lib/prisma';

// POST /squads/[id]/users
export const POST = withApiHandler(async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole(['GAME_MASTER']);
  const { id: squadId } = await ctx.params;
  const body = await request.json();
  const parsed = addUserToSquadSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Dados inválidos', parsed.error.flatten().fieldErrors);
  }

  const squad = await prisma.squad.findUnique({ where: { id: squadId } });
  if (!squad) {
    throw new ApiError(404, 'SQUAD_NOT_FOUND', 'Squad não encontrado');
  }
  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'Usuário não encontrado');
  }

  const updated = await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { squadId },
  });
  return NextResponse.json({ data: updated, message: 'Usuário adicionado ao squad' });
});
