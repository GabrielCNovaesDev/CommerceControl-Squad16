import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiHandler } from '@/lib/apiAuth';
import { restockInventorySchema } from '@/lib/validators/stores';
import prisma from '@/lib/prisma';

// POST /stores/[storeId]/inventory/restock
export const POST = withApiHandler(async (request: NextRequest, ctx: { params: Promise<{ storeId: string }> }) => {
  await requireRole(['GAME_MASTER']);
  const { storeId } = await ctx.params;
  const body = await request.json();
  const parsed = restockInventorySchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Dados inválidos', parsed.error.flatten().fieldErrors);
  }
  const { productId, quantity } = parsed.data;

  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) {
    throw new ApiError(404, 'STORE_NOT_FOUND', 'Loja não encontrada');
  }
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Produto não encontrado');
  }

  const inventory = await prisma.inventory.upsert({
    where: { storeId_productId: { storeId, productId } },
    create: { storeId, productId, quantity },
    update: { quantity: { increment: quantity } },
    include: { product: { select: { id: true, name: true } } },
  });
  return NextResponse.json({ data: inventory });
});
