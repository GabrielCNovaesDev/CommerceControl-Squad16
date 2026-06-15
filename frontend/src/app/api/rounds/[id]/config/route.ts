import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiHandler } from '@/lib/apiAuth';
import { submitConfigSchema } from '@/lib/validators/simulation';
import prisma from '@/lib/prisma';

// POST /rounds/[id]/config
export const POST = withApiHandler(async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const session = await requireRole(['PLAYER']);
  const { id: roundId } = await ctx.params;

  if (!session.user.squadId) {
    throw new ApiError(400, 'NO_SQUAD', 'Usuário não pertence a um squad');
  }
  const store = await prisma.store.findFirst({ where: { squadId: session.user.squadId } });
  if (!store) {
    throw new ApiError(404, 'NO_STORE', 'Seu squad não possui uma loja cadastrada');
  }

  const round = await prisma.round.findUnique({ where: { id: roundId } });
  if (!round || round.status !== 'OPEN') {
    throw new ApiError(400, 'ROUND_NOT_OPEN', 'Rodada não está aberta para configuração');
  }

  const body = await request.json();
  const parsed = submitConfigSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Dados inválidos', parsed.error.flatten().fieldErrors);
  }
  const data = parsed.data;

  // Upsert do RoundConfig com seus items aninhados
  const config = await prisma.roundConfig.upsert({
    where: { roundId_storeId: { roundId, storeId: store.id } },
    create: {
      roundId,
      storeId: store.id,
      otherExpenses: data.otherExpenses,
      cashierOperators: data.cashierOperators,
      serviceOperators: data.serviceOperators,
      quizScore: data.quizScore,
      numPdvs: data.numPdvs,
      capexSeguranca: data.capexSeguranca ?? false,
      capexBalanca: data.capexBalanca ?? false,
      capexRedes: data.capexRedes ?? false,
      capexSite: data.capexSite ?? false,
      capexSelfCheckout: data.capexSelfCheckout ?? false,
      capexMelhoria: data.capexMelhoria ?? false,
      roundConfigItems: {
        create: data.products.map((p) => ({
          productId: p.productId,
          margin: p.margin,
          salesVolume: p.salesVolume,
        })),
      },
    },
    update: {
      otherExpenses: data.otherExpenses,
      cashierOperators: data.cashierOperators,
      serviceOperators: data.serviceOperators,
      quizScore: data.quizScore,
      numPdvs: data.numPdvs,
      capexSeguranca: data.capexSeguranca ?? false,
      capexBalanca: data.capexBalanca ?? false,
      capexRedes: data.capexRedes ?? false,
      capexSite: data.capexSite ?? false,
      capexSelfCheckout: data.capexSelfCheckout ?? false,
      capexMelhoria: data.capexMelhoria ?? false,
      submittedAt: new Date(),
    },
    include: { roundConfigItems: { include: { product: true } } },
  });

  return NextResponse.json({ data: config, message: 'Configuração salva com sucesso' });
});
