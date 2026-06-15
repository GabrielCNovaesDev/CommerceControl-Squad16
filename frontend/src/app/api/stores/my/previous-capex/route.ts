import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'PLAYER') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const store = await prisma.store.findFirst({
      where: { squad: { users: { some: { id: session.user.id } } } },
      include: {
        financialResults: {
          orderBy: { round: { number: 'desc' } },
          take: 1,
          include: { round: { select: { number: true } } },
        },
      },
    });

    if (!store) {
      return NextResponse.json({ error: 'Nenhuma loja encontrada' }, { status: 404 });
    }

    // Obter o último CAPEX (despesas de capital)
    const lastResult = store.financialResults[0];
    const previousCapex = lastResult
      ? {
          totalCapex: 0, // Calcular baseado nos CAPEX selections
          capexSeguranca: false,
          capexBalanca: false,
          capexRedes: false,
          capexSite: false,
          capexSelfCheckout: false,
          capexMelhoria: false,
        }
      : null;

    return NextResponse.json({ data: previousCapex });
  } catch (error) {
    console.error('Erro ao obter CAPEX anterior:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}