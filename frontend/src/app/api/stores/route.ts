import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiHandler } from '@/lib/apiAuth';
import { getPaginationParams, getSkip, createPaginatedResponse } from '@/lib/pagination';
import { createStoreSchema, DEFAULT_INITIAL_CAPITAL } from '@/lib/validators/stores';
import prisma from '@/lib/prisma';

// GET /stores (lista paginada, somente GM)
export const GET = withApiHandler(async (request: NextRequest) => {
  await requireRole(['GAME_MASTER']);
  const params = getPaginationParams(request);
  const skip = getSkip(params);

  const [stores, total] = await Promise.all([
    prisma.store.findMany({
      skip,
      take: params.limit,
      include: {
        squad: { select: { id: true, name: true } },
        _count: { select: { inventories: true, roundConfigs: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.store.count(),
  ]);
  return NextResponse.json(createPaginatedResponse(stores, total, params.page!, params.limit!));
});

// POST /stores
// Regra de produto: APENAS o Game Master cria lojas (para qualquer squad).
// O capital inicial é predefinido (DEFAULT_INITIAL_CAPITAL) e não é enviado no body.
// Ao criar a loja, é gerado automaticamente um inventário zerado para todos os produtos existentes.
export const POST = withApiHandler(async (request: NextRequest) => {
  await requireRole(['GAME_MASTER']);
  const body = await request.json();
  const parsed = createStoreSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Dados inválidos', parsed.error.flatten().fieldErrors);
  }
  const { name, squadId } = parsed.data;

  // Cria a loja e o inventário zerado para todos os produtos existentes.
  // A regra "um squad só pode ter uma loja" é garantida por @@unique([squadId])
  // no model Store. O withApiHandler converte P2002 (unique violation) em 409.
  const result = await prisma.$transaction(async (tx) => {
    const store = await tx.store.create({
      data: {
        name,
        initialCapital: DEFAULT_INITIAL_CAPITAL,
        currentCash: DEFAULT_INITIAL_CAPITAL,
        squadId,
      },
      include: { squad: { select: { id: true, name: true } } },
    });

    const products = await tx.product.findMany({ select: { id: true } });
    if (products.length > 0) {
      await tx.inventory.createMany({
        data: products.map((p) => ({
          storeId: store.id,
          productId: p.id,
          quantity: 0,
        })),
      });
    }

    return store;
  });

  return NextResponse.json({ data: result }, { status: 201 });
});
