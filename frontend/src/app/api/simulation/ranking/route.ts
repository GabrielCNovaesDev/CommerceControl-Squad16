import { NextRequest, NextResponse } from 'next/server';
import { requireRole, withApiHandler } from '@/lib/apiAuth';
import prisma from '@/lib/prisma';

// GET /simulation/ranking
// Sem ?roundId: ranking acumulado por loja (soma de EBITDAs em todas as rodadas).
// Com ?roundId: ranking daquela rodada (ordenado por EBITDA desc).
export const GET = withApiHandler(async (request: NextRequest) => {
  await requireRole(['GAME_MASTER', 'PLAYER']);
  const roundId = request.nextUrl.searchParams.get('roundId');

  const results = await prisma.financialResult.findMany({
    where: roundId ? { roundId } : {},
    include: {
      store: { select: { id: true, name: true, squad: { select: { id: true, name: true } } } },
      round: { select: { id: true, number: true } },
    },
    orderBy: [{ round: { number: 'desc' } }, { ebitda: 'desc' }],
  });

  if (!roundId) {
    const aggregated = results.reduce<Record<string, {
      storeId: string;
      storeName: string;
      squadName: string;
      totalEbitda: number;
      roundsPlayed: number;
      avgEbitda: number;
    }>>((acc, r) => {
      const id = r.storeId;
      if (!acc[id]) {
        acc[id] = {
          storeId: id,
          storeName: r.store.name,
          squadName: r.store.squad.name,
          totalEbitda: 0,
          roundsPlayed: 0,
          avgEbitda: 0,
        };
      }
      acc[id].totalEbitda += Number(r.ebitda);
      acc[id].roundsPlayed += 1;
      return acc;
    }, {});

    const ranking = Object.values(aggregated)
      .map((r) => ({ ...r, avgEbitda: r.roundsPlayed > 0 ? r.totalEbitda / r.roundsPlayed : 0 }))
      .sort((a, b) => b.totalEbitda - a.totalEbitda)
      .map((r, index) => ({ ...r, rank: index + 1 }));
    return NextResponse.json({ data: ranking });
  }

  const ranking = results
    .map((r) => ({
      rank: 0,
      storeId: r.storeId,
      storeName: r.store.name,
      squadName: r.store.squad.name,
      ebitda: Number(r.ebitda),
      ebitdaMargin: Number(r.ebitdaMargin),
      totalScore: r.totalScore,
    }))
    .sort((a, b) => b.ebitda - a.ebitda)
    .map((r, index) => ({ ...r, rank: index + 1 }));
  return NextResponse.json({ data: ranking });
});
