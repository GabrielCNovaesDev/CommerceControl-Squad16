import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiHandler } from '@/lib/apiAuth';
import { updateInventorySchema } from '@/lib/validators/stores';
import prisma from '@/lib/prisma';

// PUT /stores/[storeId]/inventory/[productId]
export const PUT = withApiHandler(async (request: NextRequest, ctx: { params: Promise<{ storeId: string; productId: string }> }) => {
  await requireRole(['GAME_MASTER']);
  const { storeId, productId } = await ctx.params;
  const body = await request.json();
  const parsed = updateInventorySchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Dados inválidos', parsed.error.flatten().fieldErrors);
  }
  const { quantity } = parsed.data;

  const inventory = await prisma.inventory.upsert({
    where: { storeId_productId: { storeId, productId } },
    create: { storeId, productId, quantity },
    update: { quantity },
    include: { product: { select: { id: true, name: true } } },
  });
  return NextResponse.json({ data: inventory });
});
