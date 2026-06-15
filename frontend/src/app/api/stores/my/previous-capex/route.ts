import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiHandler } from '@/lib/apiAuth';
import prisma from '@/lib/prisma';

// GET /stores/my/previous-capex
export const GET = withApiHandler(async (_request: NextRequest) => {
  const session = await requireRole(['PLAYER']);

  const store = await prisma.store.findFirst({
    where: { squad: { users: { some: { id: session.user.id } } } },
    include: {
      roundConfigs: {
        orderBy: { submittedAt: 'desc' },
        take: 1,
      },
    },
  });
  if (!store) {
    throw new ApiError(404, 'NO_STORE', 'Nenhuma loja encontrada');
  }

  // Pega os CAPEX flags do último roundConfig submetido
  const last = store.roundConfigs[0];
  const previousCapex = last
    ? {
        capexSeguranca: last.capexSeguranca,
        capexBalanca: last.capexBalanca,
        capexRedes: last.capexRedes,
        capexSite: last.capexSite,
        capexSelfCheckout: last.capexSelfCheckout,
        capexMelhoria: last.capexMelhoria,
        roundNumber: last.roundId,
      }
    : null;

  return NextResponse.json({ data: previousCapex });
});
