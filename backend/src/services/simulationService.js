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
        // a. Buscar inventory da loja
        const inventoryList = await tx.inventory.findMany({
          where: { storeId: config.storeId },
        });

        // b. Montar objetos no formato esperado pelo financeService
        const roundConfig = {
          fixedExpenses: config.fixedExpenses,
          variableExpenses: config.variableExpenses,
        };

        const items = config.roundConfigItems.map((item) => ({
          productId: item.productId,
          salePrice: item.salePrice,
          salesVolume: item.salesVolume,
          product: { purchasePrice: item.product.purchasePrice },
        }));

        const inventory = inventoryList.map((inv) => ({
          productId: inv.productId,
          quantity: inv.quantity,
        }));

        // b. Calcular DRE
        const dre = calcularDRE(roundConfig, items, inventory);

        // c. Persistir FinancialResult
        await tx.financialResult.create({
          data: {
            roundId,
            storeId: config.storeId,
            roundConfigId: config.id,
            grossRevenue: dre.grossRevenue,
            costs: dre.costs,
            expenses: dre.expenses,
            grossProfit: dre.grossProfit,
            netProfit: dre.netProfit,
            netMargin: dre.netMargin,
          },
        });

        // 3. Atualizar inventory — descontar effectiveVolume de cada item
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
      // Rollback automático pela transação; continua para a próxima loja
    }
  }
}

module.exports = { processRound };
