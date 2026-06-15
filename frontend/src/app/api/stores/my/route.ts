import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiHandler } from '@/lib/apiAuth';
import prisma from '@/lib/prisma';

// GET /stores/my
// Regra de produto: o PLAYER consulta a própria loja (baseado no squadId do seu token).
export const GET = withApiHandler(async (_request: NextRequest) => {
  const session = await requireRole(['PLAYER']);
  const store = await prisma.store.findFirst({
    where: { squad: { users: { some: { id: session.user.id } } } },
    include: { squad: { select: { id: true, name: true } } },
  });
  if (!store) {
    throw new ApiError(404, 'NO_STORE', 'Nenhuma loja encontrada');
  }
  return NextResponse.json({ data: store });
});
