const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function findByRoundAndStore(roundId, storeId) {
  return prisma.roundConfig.findUnique({
    where: { roundId_storeId: { roundId, storeId } },
    include: { roundConfigItems: true },
  });
}

async function create(roundId, storeId, {
  otherExpenses, cashierOperators, serviceOperators, quizScore,
  numPdvs, capexSeguranca, capexBalanca, capexRedes, capexSite, capexSelfCheckout, capexMelhoria,
}, items) {
  return prisma.$transaction(async (tx) => {
    const roundConfig = await tx.roundConfig.create({
      data: {
        roundId,
        storeId,
        otherExpenses,
        cashierOperators,
        serviceOperators,
        quizScore,
        numPdvs,
        capexSeguranca,
        capexBalanca,
        capexRedes,
        capexSite,
        capexSelfCheckout,
        capexMelhoria,
        roundConfigItems: {
          create: items.map(({ productId, margin, salesVolume }) => ({
            productId,
            margin,
            salesVolume,
          })),
        },
      },
      include: { roundConfigItems: true },
    });
    return roundConfig;
  });
}

function findAllByRound(roundId) {
  return prisma.roundConfig.findMany({
    where: { roundId },
    include: {
      store: true,
      roundConfigItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              purchasePrice: true,
              taxRate: true,
              breakageRate: true,
              agingRate: true,
              mixAvailable: true,
            },
          },
        },
      },
    },
  });
}

module.exports = { findByRoundAndStore, create, findAllByRound };
