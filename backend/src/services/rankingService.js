const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getRanking(roundId) {
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
    if (b.netMargin !== a.netMargin) return b.netMargin - a.netMargin;
    return b.netProfit - a.netProfit;
  });

  return sorted.map((result, index) => ({
    position: index + 1,
    squadId: result.store.squad.id,
    squadName: result.store.squad.name,
    storeName: result.store.name,
    netMargin: result.netMargin,
    netProfit: result.netProfit,
    grossRevenue: result.grossRevenue,
  }));
}

module.exports = { getRanking };
