import prisma, { toNum } from '../utils/prisma';

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

  // Converte Decimal → number na fronteira com o Prisma
  const normalized = results.map((r: { ebitdaMargin: { toNumber(): number }; ebitda: { toNumber(): number }; grossRevenue: { toNumber(): number }; netRevenue: { toNumber(): number }; store: { squad: { id: string; name: string }; name: string } }) => ({
    ...r,
    ebitdaMargin: toNum(r.ebitdaMargin),
    ebitda: toNum(r.ebitda),
    grossRevenue: toNum(r.grossRevenue),
    netRevenue: toNum(r.netRevenue),
  }));

  const sorted = normalized.sort((a: typeof normalized[number], b: typeof normalized[number]) => {
    if (b.ebitdaMargin !== a.ebitdaMargin) return b.ebitdaMargin - a.ebitdaMargin;
    return b.ebitda - a.ebitda;
  });

  return sorted.map((result: typeof normalized[number], index: number) => ({
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
