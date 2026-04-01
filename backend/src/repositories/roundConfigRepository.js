const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function findByRoundAndStore(roundId, storeId) {
  return prisma.roundConfig.findUnique({
    where: { roundId_storeId: { roundId, storeId } },
    include: { roundConfigItems: true },
  });
}

async function create(roundId, storeId, fixedExpenses, variableExpenses, items) {
  return prisma.$transaction(async (tx) => {
    const roundConfig = await tx.roundConfig.create({
      data: {
        roundId,
        storeId,
        fixedExpenses,
        variableExpenses,
        roundConfigItems: {
          create: items.map(({ productId, salePrice, salesVolume }) => ({
            productId,
            salePrice,
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
          product: { select: { id: true, name: true, purchasePrice: true } },
        },
      },
    },
  });
}

module.exports = { findByRoundAndStore, create, findAllByRound };
