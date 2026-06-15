import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiHandler } from '@/lib/apiAuth';
import prisma from '@/lib/prisma';

export const GET = withApiHandler(async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole(['GAME_MASTER', 'PLAYER']);
  const { id } = await ctx.params;

  const round = await prisma.round.findUnique({
    where: { id },
    include: {
      _count: { select: { roundConfigs: true, financialResults: true } },
      roundConfigs: { select: { storeId: true } },
    },
  });

  if (!round) {
    throw new ApiError(404, 'ROUND_NOT_FOUND', 'Rodada não encontrada');
  }

  // Contrato antigo: devolve submittedConfigsCount + submittedStoreIds
  const { _count, roundConfigs, ...rest } = round;
  return NextResponse.json({
    data: {
      ...rest,
      submittedConfigsCount: _count.roundConfigs,
      submittedStoreIds: roundConfigs.map((rc) => rc.storeId),
    },
  });
});
