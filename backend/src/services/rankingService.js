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

module.exports = { getRanking };
