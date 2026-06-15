import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiHandler } from '@/lib/apiAuth';
import { updateSquadSchema } from '@/lib/validators/squads';
import prisma from '@/lib/prisma';

export const PUT = withApiHandler(async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole(['GAME_MASTER']);
  const { id } = await ctx.params;
  const body = await request.json();
  const parsed = updateSquadSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Dados inválidos', parsed.error.flatten().fieldErrors);
  }
  const squad = await prisma.squad.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ data: squad });
});

export const DELETE = withApiHandler(async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole(['GAME_MASTER']);
  const { id } = await ctx.params;

  // Cascade: remove referências
  await prisma.$transaction([
    prisma.user.updateMany({ where: { squadId: id }, data: { squadId: null } }),
    prisma.squad.delete({ where: { id } }),
  ]);
  return NextResponse.json({ message: 'Squad deletado com sucesso' });
});
