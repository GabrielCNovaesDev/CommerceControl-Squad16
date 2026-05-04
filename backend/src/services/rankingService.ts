import prisma from '../utils/prisma';

export interface RankingEntry {
  position: number;
  squadId: string;
  squadName: string;
  storeName: string;
  ebitdaMargin: number;
  ebitda: number;
  grossRevenue: number;
  netRevenue: number;
}

export async function getRanking(roundId: string): Promise<RankingEntry[]> {
  const results = await prisma.financialResult.findMany({
    where: { roundId },
    include: {
      store: {
        include: {
          squad: { select: { id: true, name: true } },
        },
      },
    },
  });

  const sorted = results.sort((a, b) => {
    if (b.ebitdaMargin !== a.ebitdaMargin) return b.ebitdaMargin - a.ebitdaMargin;
    return b.ebitda - a.ebitda;
  });

  return sorted.map((result, index) => ({
    position: index + 1,
    squadId: result.store.squad.id,
    squadName: result.store.squad.name,
    storeName: result.store.name,
    ebitdaMargin: result.ebitdaMargin,
    ebitda: result.ebitda,
    grossRevenue: result.grossRevenue,
    netRevenue: result.netRevenue,
  }));
}
