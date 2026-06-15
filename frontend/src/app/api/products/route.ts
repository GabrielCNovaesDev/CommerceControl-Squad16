import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiHandler } from '@/lib/apiAuth';
import { getPaginationParams, getSkip, createPaginatedResponse } from '@/lib/pagination';
import { createProductSchema } from '@/lib/validators/products';
import prisma from '@/lib/prisma';

export const GET = withApiHandler(async (request: NextRequest) => {
  await requireRole(['GAME_MASTER', 'PLAYER']);
  const params = getPaginationParams(request);
  const skip = getSkip(params);

  const [products, total] = await Promise.all([
    prisma.product.findMany({ skip, take: params.limit, orderBy: { name: 'asc' } }),
    prisma.product.count(),
  ]);
  return NextResponse.json(createPaginatedResponse(products, total, params.page!, params.limit!));
});

export const POST = withApiHandler(async (request: NextRequest) => {
  await requireRole(['GAME_MASTER']);
  const body = await request.json();
  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Dados inválidos', parsed.error.flatten().fieldErrors);
  }
  const product = await prisma.product.create({ data: parsed.data });
  return NextResponse.json({ data: product }, { status: 201 });
});
