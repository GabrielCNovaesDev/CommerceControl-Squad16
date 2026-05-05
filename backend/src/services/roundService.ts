import prisma from '../utils/prisma';

/**
 * Exclui a última rodada (maior número) e reverte o inventário se estava CLOSED.
 * Lança erro se não houver rodadas ou se estiver em PROCESSING.
 */
export async function deleteLastRound(): Promise<{ roundNumber: number }> {
  const lastRound = await prisma.round.findFirst({ orderBy: { number: 'desc' } });
  if (!lastRound) {
    const err = Object.assign(new Error('Nenhuma rodada encontrada'), { statusCode: 404, code: 'ROUND_NOT_FOUND' });
    throw err;
  }

  if (lastRound.status === 'PROCESSING') {
    const err = Object.assign(new Error('Não é possível excluir uma rodada em processamento'), { statusCode: 409, code: 'ROUND_PROCESSING' });
    throw err;
  }

  await prisma.$transaction(async (tx) => {
    if (lastRound.status === 'CLOSED') {
      const configs = await tx.roundConfig.findMany({
        where: { roundId: lastRound.id },
        include: { roundConfigItems: true, financialResult: true },
      });

      for (const config of configs) {
        for (const item of config.roundConfigItems) {
          await tx.inventory.upsert({
            where: { storeId_productId: { storeId: config.storeId, productId: item.productId } },
            create: { storeId: config.storeId, productId: item.productId, quantity: item.salesVolume },
            update: { quantity: { increment: item.salesVolume } },
          });
        }
      }

      await tx.financialResult.deleteMany({ where: { roundId: lastRound.id } });
    }

    const configIds = await tx.roundConfig
      .findMany({ where: { roundId: lastRound.id }, select: { id: true } })
      .then((rows) => rows.map((r) => r.id));

    if (configIds.length > 0) {
      await tx.roundConfigItem.deleteMany({ where: { roundConfigId: { in: configIds } } });
    }
    await tx.roundConfig.deleteMany({ where: { roundId: lastRound.id } });
    await tx.round.delete({ where: { id: lastRound.id } });
  });

  return { roundNumber: lastRound.number };
}

/**
 * Reinicia o jogo: remove todas as rodadas, configs e resultados,
 * e restaura o caixa de cada loja ao capital inicial.
 */
export async function resetGame(): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.financialResult.deleteMany({});
    await tx.roundConfigItem.deleteMany({});
    await tx.roundConfig.deleteMany({});
    await tx.round.deleteMany({});

    // Restaura currentCash = initialCapital para todas as lojas em uma única query
    await tx.$executeRaw`UPDATE "Store" SET "currentCash" = "initialCapital"`;

    await tx.inventory.updateMany({ data: { quantity: 0 } });
  });
}
