import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

// GET /rounds/[id]/results
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();

    if (!session || !['GAME_MASTER', 'PLAYER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id: roundId } = await params;
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    const results = await prisma.financialResult.findMany({
      where: {
        roundId,
        ...(storeId ? { storeId } : {}),
      },
      include: {
        store: { select: { id: true, name: true } },
        roundConfig: {
          include: {
            roundConfigItems: {
              include: { product: true },
            },
          },
        },
      },
      orderBy: { ebitda: 'desc' },
    });

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error('Erro ao obter resultados:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}