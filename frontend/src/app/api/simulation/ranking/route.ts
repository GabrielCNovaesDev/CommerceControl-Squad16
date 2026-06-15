import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

// GET /simulation/ranking
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['GAME_MASTER', 'PLAYER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const roundId = searchParams.get('roundId');

    const results = await prisma.financialResult.findMany({
      where: roundId ? { roundId } : {},
      include: {
        store: {
          select: {
            id: true,
            name: true,
            squad: { select: { id: true, name: true } },
          },
        },
        round: { select: { id: true, number: true } },
      },
      orderBy: [{ round: { number: 'desc' } }, { ebitda: 'desc' }],
    });

    // Calcular ranking acumulado se não filtrar por rodada
    if (!roundId) {
      const aggregated = results.reduce((acc, result) => {
        const storeId = result.storeId;
        if (!acc[storeId]) {
          acc[storeId] = {
            storeId,
            storeName: result.store.name,
            squadName: result.store.squad.name,
            totalEbitda: 0,
            roundsPlayed: 0,
            avgEbitda: 0,
          };
        }
        acc[storeId].totalEbitda += parseFloat(result.ebitda.toString());
        acc[storeId].roundsPlayed += 1;
        return acc;
      }, {} as Record<string, { storeId: string; storeName: string; squadName: string; totalEbitda: number; roundsPlayed: number; avgEbitda: number }>);

      const ranking = Object.values(aggregated)
        .map((r) => ({
          ...r,
          avgEbitda: r.roundsPlayed > 0 ? r.totalEbitda / r.roundsPlayed : 0,
        }))
        .sort((a, b) => b.totalEbitda - a.totalEbitda)
        .map((r, index) => ({ ...r, rank: index + 1 }));

      return NextResponse.json({ data: ranking });
    }

    // Ranking por rodada específica
    const ranking = results
      .sort((a, b) => parseFloat(b.ebitda.toString()) - parseFloat(a.ebitda.toString()))
      .map((r, index) => ({
        rank: index + 1,
        storeId: r.storeId,
        storeName: r.store.name,
        squadName: r.store.squad.name,
        ebitda: parseFloat(r.ebitda.toString()),
        ebitdaMargin: parseFloat(r.ebitdaMargin.toString()),
        totalScore: r.totalScore,
      }));

    return NextResponse.json({ data: ranking });
  } catch (error) {
    console.error('Erro ao obter ranking:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}