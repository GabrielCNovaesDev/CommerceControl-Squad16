import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { ApiError, requireRole, withApiHandler } from '@/lib/apiAuth';
import { updateUserSchema } from '@/lib/validators/users';
import prisma from '@/lib/prisma';

const safeSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  cargo: true,
  leader: true,
  squadId: true,
  createdAt: true,
} as const;

export const PUT = withApiHandler(async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole(['GAME_MASTER']);
  const { id } = await ctx.params;
  const body = await request.json();

  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Dados inválidos', parsed.error.flatten().fieldErrors);
  }
  const { password, ...rest } = parsed.data;
  const data: Record<string, unknown> = { ...rest };
  if (password) {
    data.password = await bcrypt.hash(password, 10);
  }
  const user = await prisma.user.update({ where: { id }, data, select: safeSelect });
  return NextResponse.json({ data: user });
});

export const DELETE = withApiHandler(async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole(['GAME_MASTER']);
  const { id } = await ctx.params;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'Usuário não encontrado');
  }
  if (existing.leader) {
    throw new ApiError(409, 'USER_IS_LEADER', 'Transfira a liderança antes de remover este usuário');
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ message: 'Usuário deletado com sucesso' });
});
