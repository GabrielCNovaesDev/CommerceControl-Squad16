import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

// DELETE /rounds/last
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || session.user.role !== 'GAME_MASTER') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const lastRound = await prisma.round.findFirst({
      orderBy: { number: 'desc' },
    });

    if (!lastRound) {
      return NextResponse.json({ error: 'Nenhuma rodada para deletar' }, { status: 404 });
    }

    await prisma.round.delete({ where: { id: lastRound.id } });

    return NextResponse.json({ message: 'Última rodada deletada' });
  } catch (error) {
    console.error('Erro ao deletar rodada:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}