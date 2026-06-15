import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiHandler } from '@/lib/apiAuth';
import prisma from '@/lib/prisma';

// GET /stores/[storeId]/inventory
export const GET = withApiHandler(async (_request: NextRequest, ctx: { params: Promise<{ storeId: string }> }) => {
  const session = await requireRole(['GAME_MASTER', 'PLAYER']);
  const { storeId } = await ctx.params;

  // Player só vê inventário da própria loja
  if (session.user.role === 'PLAYER') {
    const ownStore = await prisma.store.findFirst({
      where: { squad: { users: { some: { id: session.user.id } } } },
      select: { id: true },
    });
    if (!ownStore || ownStore.id !== storeId) {
      throw new ApiError(403, 'NOT_YOUR_STORE', 'Você não tem acesso a esta loja');
    }
  }

  const inventories = await prisma.inventory.findMany({
    where: { storeId },
    include: { product: { select: { id: true, name: true, purchasePrice: true } } },
  });
  return NextResponse.json({ data: inventories });
});
