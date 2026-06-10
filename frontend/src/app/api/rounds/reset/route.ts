import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

// POST /rounds/reset
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || session.user.role !== 'GAME_MASTER') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Deletar todas as rodadas e resultados
    await prisma.financialResult.deleteMany();
    await prisma.roundConfigItem.deleteMany();
    await prisma.roundConfig.deleteMany();
    await prisma.roundEvent.deleteMany();
    await prisma.round.deleteMany();

    // Resetar capital das lojas para o valor inicial
    const stores = await prisma.store.findMany({
      select: { id: true, initialCapital: true },
    });

    for (const store of stores) {
      await prisma.store.update({
        where: { id: store.id },
        data: { currentCash: store.initialCapital },
      });
    }

    return NextResponse.json({ message: 'Jogo resetado com sucesso' });
  } catch (error) {
    console.error('Erro ao resetar jogo:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}