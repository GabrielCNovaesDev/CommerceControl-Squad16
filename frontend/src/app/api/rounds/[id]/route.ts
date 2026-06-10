import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();

    if (!session || !['GAME_MASTER', 'PLAYER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id } = await params;

    const round = await prisma.round.findUnique({
      where: { id },
      include: {
        _count: {
          select: { roundConfigs: true, financialResults: true },
        },
      },
    });

    if (!round) {
      return NextResponse.json({ error: 'Rodada não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ data: round });
  } catch (error) {
    console.error('Erro ao obter rodada:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}