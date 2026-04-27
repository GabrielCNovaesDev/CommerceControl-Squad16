const { PrismaClient } = require('@prisma/client');
const { calcularDRE } = require('./financeService');
const roundConfigRepository = require('../repositories/roundConfigRepository');

const prisma = new PrismaClient();

async function processRound(roundId) {
  const configs = await roundConfigRepository.findAllByRound(roundId);

  if (configs.length === 0) {
    console.log(`[simulationService] Nenhuma configuração encontrada para roundId=${roundId}. Encerrando sem cálculo.`);
    return;
  }

  for (const config of configs) {
    try {
      await prisma.$transaction(async (tx) => {
        const inventoryList = await tx.inventory.findMany({
          where: { storeId: config.storeId },
        });

        const roundConfig = {
          otherExpenses: config.otherExpenses,
        };

        const items = config.roundConfigItems.map((item) => ({
          productId: item.productId,
          margin: item.margin,
          salesVolume: item.salesVolume,
          product: {
            purchasePrice: item.product.purchasePrice,
            taxRate: item.product.taxRate,
            breakageRate: item.product.breakageRate,
            agingRate: item.product.agingRate,
          },
        }));

        const inventory = inventoryList.map((inv) => ({
          productId: inv.productId,
          quantity: inv.quantity,
        }));

        const dre = calcularDRE(roundConfig, items, inventory);

        await tx.financialResult.create({
          data: {
            roundId,
            storeId: config.storeId,
            roundConfigId: config.id,
            grossRevenue: dre.grossRevenue,
            taxes: dre.taxes,
            netRevenue: dre.netRevenue,
            costs: dre.costs,
            grossMargin: dre.grossMargin,
            totalBreakage: dre.totalBreakage,
            totalAging: dre.totalAging,
            netMarginMass: dre.netMarginMass,
            otherExpenses: dre.otherExpenses,
            ebitda: dre.ebitda,
            ebitdaMargin: dre.ebitdaMargin,
          },
        });

        for (const breakdown of dre.itemBreakdown) {
          if (breakdown.effectiveVolume === 0) continue;

          await tx.inventory.update({
            where: {
              storeId_productId: {
                storeId: config.storeId,
                productId: breakdown.productId,
              },
            },
            data: {
              quantity: {
                decrement: breakdown.effectiveVolume,
              },
            },
          });
        }
      });

      console.log(`[simulationService] Loja ${config.storeId} processada com sucesso.`);
    } catch (err) {
      console.error(`[simulationService] Erro ao processar loja ${config.storeId}:`, err.message);
    }
  }
}

module.exports = { processRound };
