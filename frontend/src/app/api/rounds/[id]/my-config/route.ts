import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

// GET /rounds/[id]/my-config
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'PLAYER') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id: roundId } = await params;

    // Obter a loja do jogador
    const store = await prisma.store.findFirst({
      where: { squad: { users: { some: { id: session.user.id } } } },
    });

    if (!store) {
      return NextResponse.json({ error: 'Nenhuma loja encontrada' }, { status: 404 });
    }

    const config = await prisma.roundConfig.findUnique({
      where: {
        roundId_storeId: { roundId, storeId: store.id },
      },
      include: {
        roundConfigItems: {
          include: { product: true },
        },
      },
    });

    return NextResponse.json({ data: config });
  } catch (error) {
    console.error('Erro ao obter configuração:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}