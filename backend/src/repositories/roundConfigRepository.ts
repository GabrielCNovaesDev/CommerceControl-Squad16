import prisma from '../utils/prisma';

function findByRoundAndStore(roundId: string, storeId: string) {
  return prisma.roundConfig.findUnique({
    where: { roundId_storeId: { roundId, storeId } },
    include: { roundConfigItems: true },
  });
}

async function create(
  roundId: string,
  storeId: string,
  config: {
    otherExpenses: number;
    cashierOperators: number;
    serviceOperators: number;
    quizScore: number;
    numPdvs: number;
    capexSeguranca: boolean;
    capexBalanca: boolean;
    capexRedes: boolean;
    capexSite: boolean;
    capexSelfCheckout: boolean;
    capexMelhoria: boolean;
  },
  items: Array<{ productId: string; margin: number; salesVolume: number }>
) {
  return prisma.$transaction(async (tx) => {
    const roundConfig = await tx.roundConfig.create({
      data: {
        roundId,
        storeId,
        ...config,
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

function findAllByRound(roundId: string) {
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

function findCapexByStore(storeId: string) {
  return prisma.roundConfig.findMany({
    where: { storeId },
    select: {
      roundId: true,
      capexSeguranca: true,
      capexBalanca: true,
      capexRedes: true,
      capexSite: true,
      capexSelfCheckout: true,
      capexMelhoria: true,
    },
  });
}

const roundConfigRepository = { findByRoundAndStore, create, findAllByRound, findCapexByStore };
export default roundConfigRepository;
