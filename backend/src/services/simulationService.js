const prisma = require('../utils/prisma');
const { calcularDRE, calcularPreco } = require('./financeService');
const roundConfigRepository = require('../repositories/roundConfigRepository');

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
 * Computes CSAT for a store.
 * Formula: min(1, cashierOperators / idealOperators=10) × quizScore
 * Example: 5 operators → 50%, quiz 0.9 → CSAT = 0.45
 */
function calcCsat(config) {
  const proportion = Math.min(1, (config.cashierOperators ?? 10) / 10);
  return proportion * (config.quizScore ?? 1.0);
}

/**
 * Computes operator payroll.
 * Caixa: R$1,000/month per operator (ideal = 10)
 * Serviço: R$1,200/month per operator (ideal = 5)
 */
function calcPayroll(config) {
  return (config.cashierOperators ?? 10) * 1000 +
         (config.serviceOperators ?? 5) * 1200;
}

/**
 * Computes interest penalty when total outlay exceeds available capital.
 * Rate: 12% monthly on the overage amount.
 * totalOutlay = stockCost + capexCost
 */
function calcInterest(totalOutlay, initialCapital) {
  if (totalOutlay <= initialCapital) return 0;
  return (totalOutlay - initialCapital) * 0.12;
}

// ─── Sprint 4: CAPEX, SLA, Licensing, Maintenance ────────────────────────────

/** CAPEX one-time investment costs (R$). */
const CAPEX_COSTS = {
  capexSeguranca:    50000,
  capexBalanca:      75000,
  capexRedes:        80000,
  capexSite:         65000,
  capexSelfCheckout: 80000,
  capexMelhoria:     45000,
};

/**
 * Total CAPEX investment selected by the store.
 */
function calcCapexCost(config) {
  return Object.entries(CAPEX_COSTS).reduce(
    (sum, [key, cost]) => sum + (config[key] ? cost : 0),
    0
  );
}

/**
 * SLA (dias de resolução de serviço) based on number of service operators.
 * Source: official table — 0→6, 1→5, 2→4, 3→3, 4→2, 5→1.
 * Also shows how long a CAPEX-risk event stops sales (N + SLA days).
 */
function calcSla(serviceOperators) {
  const table = [6, 5, 4, 3, 2, 1]; // index = operators (0–5, capped)
  return table[Math.min(serviceOperators ?? 5, 5)];
}

/**
 * Monthly software licensing costs (auto-computed).
 * - Sistema Operacional: 5 users × R$120
 * - PDVs: numPdvs × R$80
 * - Self Checkout: +4 units × R$80 if capexSelfCheckout
 * - Site: R$500/mês (+30% if capexSite → R$650)
 * - Sistemas de Segurança: R$500/mês (+20% if capexSeguranca → R$600)
 */
function calcLicensing(config) {
  const so           = 5 * 120;                                    // R$600 fixed
  const pdvs         = (config.numPdvs ?? 6) * 80;
  const selfCheckout = config.capexSelfCheckout ? 4 * 80 : 0;    // R$320 if CAPEX
  const site         = config.capexSite ? 650 : 500;
  const security     = config.capexSeguranca ? 600 : 500;
  return so + pdvs + selfCheckout + site + security;
}

/**
 * Monthly equipment maintenance fee.
 * R$400 unless CAPEX Balança/Freezer was approved (new equipment → warranty).
 */
function calcMaintenance(config) {
  return config.capexBalanca ? 0 : 400;
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

        // Compute stock purchase cost and CAPEX outlay
        const stockCost = config.roundConfigItems.reduce(
          (sum, item) => sum + item.salesVolume * item.product.purchasePrice,
          0
        );
        const capexCost  = calcCapexCost(config);
        const payroll    = calcPayroll(config);
        const licensing  = calcLicensing(config);
        const maintenance = calcMaintenance(config);
        const interestPenalty = calcInterest(stockCost + capexCost, config.store.initialCapital);
        const totalOtherExpenses =
          config.otherExpenses + payroll + licensing + maintenance + interestPenalty;

        const roundConfig = { otherExpenses: totalOtherExpenses };

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
        ` csatScore=${csatScores[config.storeId]}, total=${totalScores[config.storeId]},` +
        ` CSAT=${(calcCsat(config) * 100).toFixed(1)}%, SLA=${calcSla(config.serviceOperators)},` +
        ` payroll=${calcPayroll(config)}, licensing=${calcLicensing(config)},` +
        ` capex=${calcCapexCost(config)}`
      );
    } catch (err) {
      console.error(`[simulationService] Erro ao processar loja ${config.storeId}:`, err.message);
    }
  }
}

module.exports = {
  processRound,
  calcPayroll,
  calcInterest,
  calcCsat,
  calcSla,
  calcLicensing,
  calcMaintenance,
  calcCapexCost,
  CAPEX_COSTS,
};
