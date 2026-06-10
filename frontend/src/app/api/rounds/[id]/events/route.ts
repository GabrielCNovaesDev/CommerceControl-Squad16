import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

// GET /rounds/[id]/events
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();

    if (!session || !['GAME_MASTER', 'PLAYER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id: roundId } = await params;
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    const events = await prisma.roundEvent.findMany({
      where: {
        roundId,
        ...(storeId ? { storeId } : {}),
      },
      include: {
        store: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: events });
  } catch (error) {
    console.error('Erro ao obter eventos:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}