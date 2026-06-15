import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiHandler } from '@/lib/apiAuth';
import prisma from '@/lib/prisma';

// GET /rounds/[id]/my-config
export const GET = withApiHandler(async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const session = await requireRole(['PLAYER']);
  const { id: roundId } = await ctx.params;

  if (!session.user.squadId) {
    throw new ApiError(400, 'NO_SQUAD', 'Usuário não pertence a um squad');
  }
  const store = await prisma.store.findFirst({ where: { squadId: session.user.squadId } });
  if (!store) {
    throw new ApiError(404, 'NO_STORE', 'Seu squad não possui uma loja cadastrada');
  }

  const config = await prisma.roundConfig.findUnique({
    where: { roundId_storeId: { roundId, storeId: store.id } },
    include: { roundConfigItems: { include: { product: true } } },
  });
  return NextResponse.json({ data: config });
});
