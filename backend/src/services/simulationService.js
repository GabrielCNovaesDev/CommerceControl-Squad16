const { PrismaClient } = require('@prisma/client');
const { calcularDRE, calcularPreco } = require('./financeService');
const roundConfigRepository = require('../repositories/roundConfigRepository');

const prisma = new PrismaClient();

// ─── Demand distribution helpers ─────────────────────────────────────────────

/**
 * Ranks stores on a single metric and assigns scores 4→1 (best→worst).
 * Ties receive the same score; next rank after a tie is decremented accordingly.
 * @param {Array} stores - array of { storeId, value }
 * @param {boolean} lowerIsBetter
 * @returns {{ [storeId]: number }}
 */
function scoreMetric(stores, lowerIsBetter) {
  if (stores.length === 0) return {};

  const sorted = [...stores].sort((a, b) =>
    lowerIsBetter ? a.value - b.value : b.value - a.value
  );

  const n = sorted.length;
  const scores = {};
  let currentScore = 4;
  let i = 0;

  while (i < n) {
    // Find all stores tied at this position
    let j = i;
    while (j < n && sorted[j].value === sorted[i].value) {
      j++;
    }
    const tiedCount = j - i;
    // Best in a tie gets the current score, worst in a tie also gets it
    // but we need to respect that best=4 and worst=1 (clamp)
    const assignedScore = i === 0 ? 4 : (j === n ? 1 : Math.max(2, Math.min(3, currentScore)));
    for (let k = i; k < j; k++) {
      scores[sorted[k].storeId] = assignedScore;
    }
    currentScore = Math.max(1, currentScore - tiedCount);
    i = j;
  }

  // Ensure worst always gets 1
  const worstId = sorted[n - 1].storeId;
  if (scores[worstId] > 1 && n > 1) {
    scores[worstId] = 1;
  }

  return scores;
}

/**
 * Computes each store's basket price (weighted average by inventory).
 * Lower is better.
 */
function calcBasketPrice(config) {
  let totalValue = 0;
  let totalQty = 0;

  for (const item of config.roundConfigItems) {
    const salePrice = calcularPreco(
      item.product.purchasePrice,
      item.margin,
      item.product.taxRate
    );
    const qty = config._inventory[item.productId] ?? 0;
    totalValue += salePrice * qty;
    totalQty += qty;
  }

  return totalQty > 0 ? totalValue / totalQty : 0;
}

/**
 * Computes each store's availability score.
 * = total inventory purchased / total mixAvailable across all categories.
 * Higher is better.
 */
function calcAvailability(config) {
  let totalInventory = 0;
  let totalMix = 0;

  for (const item of config.roundConfigItems) {
    totalInventory += config._inventory[item.productId] ?? 0;
    totalMix += item.product.mixAvailable;
  }

  return totalMix > 0 ? totalInventory / totalMix : 0;
}

/**
 * Sprint 2 placeholder — all stores get equal CSAT (1.0).
 * Sprint 3 will implement: (operators / idealOperators) × quizScore.
 */
function calcCsat(_config) {
  return 1.0;
}

/**
 * Computes demand shares for all stores.
 * Returns { [storeId]: demandShare (0–1) }
 */
function computeDemandShares(configs) {
  if (configs.length === 0) return {};

  const basketPrices = configs.map((c) => ({ storeId: c.storeId, value: calcBasketPrice(c) }));
  const availabilities = configs.map((c) => ({ storeId: c.storeId, value: calcAvailability(c) }));
  const csats = configs.map((c) => ({ storeId: c.storeId, value: calcCsat(c) }));

  const priceScores = scoreMetric(basketPrices, true);   // lower price = better
  const availScores = scoreMetric(availabilities, false); // higher avail = better
  const csatScores  = scoreMetric(csats, false);          // higher CSAT = better

  const totalScores = {};
  for (const c of configs) {
    totalScores[c.storeId] =
      (priceScores[c.storeId] ?? 1) +
      (availScores[c.storeId] ?? 1) +
      (csatScores[c.storeId] ?? 1);
  }

  const grandTotal = Object.values(totalScores).reduce((s, v) => s + v, 0);
  const shares = {};
  for (const c of configs) {
    shares[c.storeId] = grandTotal > 0 ? totalScores[c.storeId] / grandTotal : 1 / configs.length;
  }

  return { shares, priceScores, availScores, csatScores, totalScores };
}

/**
 * Builds allocation map: { [productId]: units } for a store given its demand share.
 * marketDemand: { [productId]: totalMarketUnits }
 */
function buildAllocationMap(marketDemand, demandShare) {
  const allocationMap = {};
  for (const [productId, totalUnits] of Object.entries(marketDemand)) {
    allocationMap[productId] = Math.round(totalUnits * demandShare);
  }
  return allocationMap;
}

// ─── Main simulation entry point ──────────────────────────────────────────────

async function processRound(roundId) {
  // Fetch round to get demandFactor
  const round = await prisma.round.findUnique({ where: { id: roundId } });
  if (!round) {
    console.log(`[simulationService] Round ${roundId} não encontrado.`);
    return;
  }

  const configs = await roundConfigRepository.findAllByRound(roundId);

  if (configs.length === 0) {
    console.log(`[simulationService] Nenhuma configuração para roundId=${roundId}. Encerrando.`);
    return;
  }

  // Fetch inventory for all stores at once (before any transaction decrements)
  const allInventories = await prisma.inventory.findMany({
    where: { storeId: { in: configs.map((c) => c.storeId) } },
  });
  const inventoryByStore = {};
  for (const inv of allInventories) {
    if (!inventoryByStore[inv.storeId]) inventoryByStore[inv.storeId] = {};
    inventoryByStore[inv.storeId][inv.productId] = inv.quantity;
  }

  // Attach inventory snapshot to each config for scoring
  const enrichedConfigs = configs.map((c) => ({
    ...c,
    _inventory: inventoryByStore[c.storeId] ?? {},
  }));

  // Fetch products for market demand computation
  const products = await prisma.product.findMany();
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  // Market demand per product = mixAvailable × demandFactor
  const marketDemand = {};
  for (const product of products) {
    marketDemand[product.id] = Math.round(product.mixAvailable * round.demandFactor);
  }

  // Compute demand shares
  const { shares, priceScores, availScores, csatScores, totalScores } =
    computeDemandShares(enrichedConfigs);

  console.log(`[simulationService] demandFactor=${round.demandFactor}`);
  console.log(`[simulationService] Demand shares:`, shares);

  // Process each store
  for (const config of enrichedConfigs) {
    try {
      const demandShare = shares[config.storeId] ?? 0;
      const allocationMap = buildAllocationMap(marketDemand, demandShare);

      await prisma.$transaction(async (tx) => {
        const inventoryList = Object.entries(config._inventory).map(([productId, quantity]) => ({
          productId,
          quantity,
        }));

        const roundConfig = { otherExpenses: config.otherExpenses };

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

        const dre = calcularDRE(roundConfig, items, inventoryList, allocationMap);

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
            demandShare,
          },
        });

        // Decrement inventory by actual sold units
        for (const breakdown of dre.itemBreakdown) {
          if (breakdown.effectiveVolume === 0) continue;

          await tx.inventory.update({
            where: {
              storeId_productId: { storeId: config.storeId, productId: breakdown.productId },
            },
            data: { quantity: { decrement: breakdown.effectiveVolume } },
          });
        }
      });

      console.log(
        `[simulationService] Loja ${config.storeId}: share=${(demandShare * 100).toFixed(1)}%,` +
        ` priceScore=${priceScores[config.storeId]}, availScore=${availScores[config.storeId]},` +
        ` csatScore=${csatScores[config.storeId]}, total=${totalScores[config.storeId]}`
      );
    } catch (err) {
      console.error(`[simulationService] Erro ao processar loja ${config.storeId}:`, err.message);
    }
  }
}

module.exports = { processRound };
