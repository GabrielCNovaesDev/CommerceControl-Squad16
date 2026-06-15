import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiHandler } from '@/lib/apiAuth';
import { updateProductSchema } from '@/lib/validators/products';
import prisma from '@/lib/prisma';

export const PUT = withApiHandler(async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole(['GAME_MASTER']);
  const { id } = await ctx.params;
  const body = await request.json();

  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Dados inválidos', parsed.error.flatten().fieldErrors);
  }
  const product = await prisma.product.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ data: product });
});

export const DELETE = withApiHandler(async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole(['GAME_MASTER']);
  const { id } = await ctx.params;

  // Regra de negócio antiga: produto em uso não pode ser removido
  const inUse = await prisma.roundConfigItem.findFirst({ where: { productId: id } });
  if (inUse) {
    throw new ApiError(409, 'PRODUCT_IN_USE', 'Produto está em uso e não pode ser removido');
  }

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ message: 'Produto deletado com sucesso' });
});
