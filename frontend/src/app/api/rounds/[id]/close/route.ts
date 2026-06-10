import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

// PATCH /rounds/[id]/close
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();

    if (!session || session.user.role !== 'GAME_MASTER') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id } = await params;

    const round = await prisma.round.update({
      where: { id },
      data: { status: 'CLOSED' },
    });

    return NextResponse.json({ data: round, message: 'Rodada encerrada' });
  } catch (error) {
    console.error('Erro ao encerrar rodada:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}