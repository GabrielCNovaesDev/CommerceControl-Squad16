import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiHandler } from '@/lib/apiAuth';
import prisma from '@/lib/prisma';

// GET /rounds/[id]/events
export const GET = withApiHandler(async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const session = await requireRole(['GAME_MASTER', 'PLAYER']);
  const { id: roundId } = await ctx.params;
  const storeId = request.nextUrl.searchParams.get('storeId');

  // Players só podem ver eventos da própria loja
  if (session.user.role === 'PLAYER') {
    if (!session.user.squadId) {
      throw new ApiError(400, 'NO_SQUAD', 'Usuário não pertence a um squad');
    }
    const store = await prisma.store.findFirst({ where: { squadId: session.user.squadId } });
    if (!store) {
      throw new ApiError(400, 'NO_STORE', 'Seu squad não possui uma loja cadastrada');
    }
    const events = await prisma.roundEvent.findMany({
      where: { roundId, storeId: store.id },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ data: events });
  }

  // Game Master vê tudo
  const events = await prisma.roundEvent.findMany({
    where: {
      roundId,
      ...(storeId ? { storeId } : {}),
    },
    include: { store: { select: { id: true, name: true, squad: { select: { name: true } } } } },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json({ data: events });
});
