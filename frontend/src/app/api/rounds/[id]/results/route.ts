import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiHandler } from '@/lib/apiAuth';
import prisma from '@/lib/prisma';

// GET /rounds/[id]/results
export const GET = withApiHandler(async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const session = await requireRole(['GAME_MASTER', 'PLAYER']);
  const { id: roundId } = await ctx.params;
  const storeIdQuery = request.nextUrl.searchParams.get('storeId');

  const where: { roundId: string; storeId?: string } = { roundId };
  if (session.user.role === 'GAME_MASTER' && storeIdQuery) {
    where.storeId = storeIdQuery;
  } else if (session.user.role === 'PLAYER') {
    if (!session.user.squadId) {
      throw new ApiError(400, 'NO_SQUAD', 'Usuário não pertence a um squad');
    }
    const store = await prisma.store.findFirst({ where: { squadId: session.user.squadId } });
    if (!store) {
      throw new ApiError(404, 'NO_STORE', 'Seu squad não possui uma loja cadastrada');
    }
    where.storeId = store.id;
  }

  const results = await prisma.financialResult.findMany({
    where,
    include: {
      store: { select: { id: true, name: true } },
      roundConfig: { include: { roundConfigItems: { include: { product: true } } } },
    },
    orderBy: { ebitda: 'desc' },
  });
  return NextResponse.json({ data: results });
});
