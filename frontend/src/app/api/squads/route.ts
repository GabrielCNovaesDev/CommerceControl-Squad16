import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiHandler } from '@/lib/apiAuth';
import { createSquadSchema } from '@/lib/validators/squads';
import prisma from '@/lib/prisma';

export const GET = withApiHandler(async (_request: NextRequest) => {
  await requireRole(['GAME_MASTER']);
  const squads = await prisma.squad.findMany({
    include: { _count: { select: { users: true, stores: true } } },
    orderBy: { name: 'asc' },
  });
  const data = squads.map(({ _count, ...rest }) => ({
    ...rest,
    userCount: _count.users,
    storeCount: _count.stores,
  }));
  return NextResponse.json({ data });
});

export const POST = withApiHandler(async (request: NextRequest) => {
  await requireRole(['GAME_MASTER']);
  const body = await request.json();
  const parsed = createSquadSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Dados inválidos', parsed.error.flatten().fieldErrors);
  }
  const squad = await prisma.squad.create({ data: parsed.data });
  return NextResponse.json({ data: squad }, { status: 201 });
});
