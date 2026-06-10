import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

// POST /rounds/[id]/config
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();

    if (!session || session.user.role !== 'PLAYER') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id: roundId } = await params;
    const body = await request.json();

    // Obter a loja do jogador
    const store = await prisma.store.findFirst({
      where: { squad: { users: { some: { id: session.user.id } } } },
    });

    if (!store) {
      return NextResponse.json({ error: 'Nenhuma loja encontrada' }, { status: 404 });
    }

    // Verificar se a rodada está aberta
    const round = await prisma.round.findUnique({ where: { id: roundId } });
    if (!round || round.status !== 'OPEN') {
      return NextResponse.json({ error: 'Rodada não está aberta para configuração' }, { status: 400 });
    }

    const {
      otherExpenses,
      cashierOperators,
      serviceOperators,
      quizScore,
      numPdvs,
      capexSeguranca,
      capexBalanca,
      capexRedes,
      capexSite,
      capexSelfCheckout,
      capexMelhoria,
      products,
    } = body;

    // Criar ou atualizar configuração
    const config = await prisma.roundConfig.upsert({
      where: {
        roundId_storeId: { roundId, storeId: store.id },
      },
      create: {
        roundId,
        storeId: store.id,
        otherExpenses: otherExpenses ? parseFloat(otherExpenses) : 0,
        cashierOperators: cashierOperators ? parseInt(cashierOperators) : 10,
        serviceOperators: serviceOperators ? parseInt(serviceOperators) : 5,
        quizScore: quizScore ? parseFloat(quizScore) : 1.0,
        numPdvs: numPdvs ? parseInt(numPdvs) : 6,
        capexSeguranca: capexSeguranca || false,
        capexBalanca: capexBalanca || false,
        capexRedes: capexRedes || false,
        capexSite: capexSite || false,
        capexSelfCheckout: capexSelfCheckout || false,
        capexMelhoria: capexMelhoria || false,
        roundConfigItems: {
          create: products?.map((p: { productId: string; margin: number | string; salesVolume: number | string }) => ({
            productId: p.productId,
            margin: typeof p.margin === 'string' ? parseFloat(p.margin) : p.margin,
            salesVolume: typeof p.salesVolume === 'string' ? parseInt(p.salesVolume) : p.salesVolume,
          })) || [],
        },
      },
      update: {
        otherExpenses: otherExpenses ? parseFloat(otherExpenses) : undefined,
        cashierOperators: cashierOperators ? parseInt(cashierOperators) : undefined,
        serviceOperators: serviceOperators ? parseInt(serviceOperators) : undefined,
        quizScore: quizScore ? parseFloat(quizScore) : undefined,
        numPdvs: numPdvs ? parseInt(numPdvs) : undefined,
        capexSeguranca: capexSeguranca,
        capexBalanca: capexBalanca,
        capexRedes: capexRedes,
        capexSite: capexSite,
        capexSelfCheckout: capexSelfCheckout,
        capexMelhoria: capexMelhoria,
        submittedAt: new Date(),
      },
      include: {
        roundConfigItems: true,
      },
    });

    // Atualizar items se existirem
    if (products?.length && config.roundConfigItems.length > 0) {
      for (const item of config.roundConfigItems) {
        const update = products.find((p: { productId: string; margin: number | string; salesVolume: number | string }) => p.productId === item.productId);
        if (update) {
          await prisma.roundConfigItem.update({
            where: { id: item.id },
            data: {
              margin: typeof update.margin === 'string' ? parseFloat(update.margin) : update.margin,
              salesVolume: typeof update.salesVolume === 'string' ? parseInt(update.salesVolume) : update.salesVolume,
            },
          });
        }
      }
    }

    return NextResponse.json({ data: config, message: 'Configuração salva com sucesso' });
  } catch (error) {
    console.error('Erro ao salvar configuração:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}