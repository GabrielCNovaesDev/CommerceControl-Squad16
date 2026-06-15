import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'GAME_MASTER') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const stores = await prisma.store.findMany({
      include: {
        squad: { select: { id: true, name: true } },
        _count: {
          select: { inventories: true, roundConfigs: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: stores });
  } catch (error) {
    console.error('Erro ao listar lojas:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}