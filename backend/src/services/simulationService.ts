import prisma, { toNum } from '../utils/prisma';
import type { Prisma } from '@prisma/client';
import { calcularDRE, calcularPreco } from './financeService';
import roundConfigRepository from '../repositories/roundConfigRepository';
import { generateAiReport, generateGmReport, MarketAggregates } from './aiReportService';
import { rollEvents } from './eventService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoreMetric {
  storeId: string;
  value: number;
}

interface ScoreMap {
  [storeId: string]: number;
}

interface DemandShareResult {
  shares: Record<string, number>;
  priceScores: ScoreMap;
  availScores: ScoreMap;
  csatScores: ScoreMap;
  totalScores: ScoreMap;
}

export interface CapexConfig {
  capexSeguranca?: boolean;
  capexBalanca?: boolean;
  capexRedes?: boolean;
  capexSite?: boolean;
  capexSelfCheckout?: boolean;
  capexMelhoria?: boolean;
}

export interface OperatorsConfig {
  cashierOperators?: number;
  serviceOperators?: number;
  quizScore?: number;
  numPdvs?: number;
  otherExpenses?: number;
}

export type SimulationConfig = CapexConfig & OperatorsConfig;

// ─── Demand distribution helpers ─────────────────────────────────────────────

/**
 * Ranks stores on a single metric and assigns scores 4→1 (best→worst).
 * Ties receive the same score; next rank after a tie is decremented accordingly.
 */
function scoreMetric(stores: StoreMetric[], lowerIsBetter: boolean): ScoreMap {
  if (stores.length === 0) return {};

  const sorted = [...stores].sort((a, b) =>
    lowerIsBetter ? a.value - b.value : b.value - a.value
  );

  const n = sorted.length;
  const scores: ScoreMap = {};
  let currentScore = 4;
  let i = 0;

  while (i < n) {
    let j = i;
    while (j < n && sorted[j].value === sorted[i].value) {
      j++;
    }
    const tiedCount = j - i;
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
function calcBasketPrice(config: Awaited<ReturnType<typeof roundConfigRepository.findAllByRound>>[number] & { _inventory: Record<string, number> }): number {
  let totalValue = 0;
  let totalQty = 0;

  for (const item of config.roundConfigItems) {
    const salePrice = calcularPreco(
      toNum(item.product.purchasePrice),
      toNum(item.margin),
      toNum(item.product.taxRate)
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
function calcAvailability(config: Awaited<ReturnType<typeof roundConfigRepository.findAllByRound>>[number] & { _inventory: Record<string, number> }): number {
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
 */
export function calcCsat(config: OperatorsConfig): number {
  const proportion = Math.min(1, (config.cashierOperators ?? 10) / 10);
  return proportion * (config.quizScore ?? 1.0);
}

/**
 * Computes operator payroll.
 * Caixa: R$1,000/month per operator (ideal = 10)
 * Serviço: R$1,200/month per operator (ideal = 5)
 */
export function calcPayroll(config: OperatorsConfig): number {
  return (config.cashierOperators ?? 10) * 1000 +
         (config.serviceOperators ?? 5) * 1200;
}

/**
 * Computes interest penalty when total outlay exceeds available capital.
 * Rate: 12% monthly on the overage amount.
 */
export function calcInterest(totalOutlay: number, initialCapital: number): number {
  if (totalOutlay <= initialCapital) return 0;
  return (totalOutlay - initialCapital) * 0.12;
}

// ─── Sprint 4: CAPEX, SLA, Licensing, Maintenance ────────────────────────────

/** CAPEX one-time investment costs (R$). */
export const CAPEX_COSTS: Record<string, number> = {
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
export function calcCapexCost(config: CapexConfig): number {
  return Object.entries(CAPEX_COSTS).reduce(
    (sum, [key, cost]) => sum + ((config as Record<string, unknown>)[key] ? cost : 0),
    0
  );
}

/**
 * SLA (dias de resolução de serviço) based on number of service operators.
 * Source: official table — 0→6, 1→5, 2→4, 3→3, 4→2, 5→1.
 */
export function calcSla(serviceOperators?: number): number {
  const table = [6, 5, 4, 3, 2, 1]; // index = operators (0–5, capped)
  return table[Math.min(serviceOperators ?? 5, 5)];
}

/**
 * Monthly software licensing costs (auto-computed).
 */
export function calcLicensing(config: CapexConfig & { numPdvs?: number }): number {
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
export function calcMaintenance(config: CapexConfig): number {
  return config.capexBalanca ? 0 : 400;
}

/**
 * Computes demand shares for all stores.
 */
function computeDemandShares(
  configs: Array<Awaited<ReturnType<typeof roundConfigRepository.findAllByRound>>[number] & { _inventory: Record<string, number> }>
): DemandShareResult {
  if (configs.length === 0) return { shares: {}, priceScores: {}, availScores: {}, csatScores: {}, totalScores: {} };

  const basketPrices = configs.map((c: typeof configs[number]) => ({ storeId: c.storeId, value: calcBasketPrice(c) }));
  const availabilities = configs.map((c: typeof configs[number]) => ({ storeId: c.storeId, value: calcAvailability(c) }));
  const csats = configs.map((c) => ({
    storeId: c.storeId,
    value: calcCsat({ cashierOperators: c.cashierOperators, quizScore: toNum(c.quizScore) }),
  }));

  const priceScores = scoreMetric(basketPrices, true);   // lower price = better
  const availScores = scoreMetric(availabilities, false); // higher avail = better
  const csatScores  = scoreMetric(csats, false);          // higher CSAT = better

  const totalScores: ScoreMap = {};
  for (const c of configs) {
    totalScores[c.storeId] =
      (priceScores[c.storeId] ?? 1) +
      (availScores[c.storeId] ?? 1) +
      (csatScores[c.storeId] ?? 1);
  }

  const grandTotal = Object.values(totalScores).reduce((s, v) => s + v, 0);
  const shares: Record<string, number> = {};
  for (const c of configs) {
    shares[c.storeId] = grandTotal > 0 ? totalScores[c.storeId] / grandTotal : 1 / configs.length;
  }

  return { shares, priceScores, availScores, csatScores, totalScores };
}

/**
 * Builds allocation map: { [productId]: units } for a store given its demand share.
 */
function buildAllocationMap(
  marketDemand: Record<string, number>,
  demandShare: number
): Record<string, number> {
  const allocationMap: Record<string, number> = {};
  for (const [productId, totalUnits] of Object.entries(marketDemand)) {
    allocationMap[productId] = Math.round(totalUnits * demandShare);
  }
  return allocationMap;
}

// ─── Main simulation entry point ──────────────────────────────────────────────

export async function processRound(roundId: string): Promise<void> {
  const round = await prisma.round.findUnique({ where: { id: roundId } });
  if (!round) {
    console.warn(JSON.stringify({ level: 'warn', service: 'simulationService', message: `Round ${roundId} não encontrado`, roundId, timestamp: new Date().toISOString() }));
    return;
  }

  const configs = await roundConfigRepository.findAllByRound(roundId);

  if (configs.length === 0) {
    console.warn(JSON.stringify({ level: 'warn', service: 'simulationService', message: 'Nenhuma configuração para rodada', roundId, timestamp: new Date().toISOString() }));
    return;
  }

  // Fetch inventory for all stores at once
  const allInventories = await prisma.inventory.findMany({
    where: { storeId: { in: configs.map((c: { storeId: string }) => c.storeId) } },
  });
  const inventoryByStore: Record<string, Record<string, number>> = {};
  for (const inv of allInventories) {
    if (!inventoryByStore[inv.storeId]) inventoryByStore[inv.storeId] = {};
    inventoryByStore[inv.storeId][inv.productId] = inv.quantity;
  }

  // Attach inventory snapshot to each config for scoring
  const enrichedConfigs = configs.map((c: typeof configs[number]) => ({
    ...c,
    _inventory: inventoryByStore[c.storeId] ?? {},
  }));

  // Fetch products for market demand computation
  const products = await prisma.product.findMany();

  // Market demand per product = mixAvailable × demandFactor
  const marketDemand: Record<string, number> = {};
  for (const product of products) {
    marketDemand[product.id] = Math.round(product.mixAvailable * toNum(round.demandFactor));
  }

  // Compute demand shares
  const { shares, priceScores, availScores, csatScores, totalScores } =
    computeDemandShares(enrichedConfigs);

  console.info(JSON.stringify({ level: 'info', service: 'simulationService', message: 'Demand shares calculados', roundId, demandFactor: round.demandFactor, shares, timestamp: new Date().toISOString() }));

  // Roll random events and compute penalties per store
  const eventPenalties = await rollEvents(roundId);

  // Process each store
  for (const config of enrichedConfigs) {
    try {
      const demandShare = shares[config.storeId] ?? 0;
      const allocationMap = buildAllocationMap(marketDemand, demandShare);

      // Normaliza Decimal → number fora da transação para uso nos logs também
      const configNum = {
        cashierOperators: config.cashierOperators,
        serviceOperators: config.serviceOperators,
        quizScore: toNum(config.quizScore),
        numPdvs: config.numPdvs,
        capexSeguranca: config.capexSeguranca,
        capexBalanca: config.capexBalanca,
        capexRedes: config.capexRedes,
        capexSite: config.capexSite,
        capexSelfCheckout: config.capexSelfCheckout,
        capexMelhoria: config.capexMelhoria,
      };

      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const inventoryList = Object.entries(config._inventory).map(([productId, quantity]) => ({
          productId,
          quantity: quantity as number,
        }));

        const items = config.roundConfigItems.map((item: { productId: string; margin: { toNumber(): number } | number; salesVolume: number; product: { purchasePrice: { toNumber(): number }; taxRate: { toNumber(): number }; breakageRate: { toNumber(): number }; agingRate: { toNumber(): number } } }) => ({
          productId: item.productId,
          margin: toNum(item.margin),
          salesVolume: item.salesVolume,
          product: {
            purchasePrice: toNum(item.product.purchasePrice),
            taxRate: toNum(item.product.taxRate),
            breakageRate: toNum(item.product.breakageRate),
            agingRate: toNum(item.product.agingRate),
          },
        }));

        // Compute stock purchase cost and CAPEX outlay
        const stockCost = config.roundConfigItems.reduce(
          (sum: number, item: { salesVolume: number; product: { purchasePrice: { toNumber(): number } } }) => sum + item.salesVolume * toNum(item.product.purchasePrice),
          0
        );
        const capexCost   = calcCapexCost(configNum);
        const payroll     = calcPayroll(configNum);
        const interestPenalty = calcInterest(stockCost + capexCost, toNum(config.store.initialCapital));
        const eventPenalty = eventPenalties[config.storeId] ?? 0;
        const totalOtherExpenses =
          toNum(config.otherExpenses) + payroll + interestPenalty + eventPenalty;

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
            priceScore: priceScores[config.storeId] ?? null,
            availScore: availScores[config.storeId] ?? null,
            csatScore: csatScores[config.storeId] ?? null,
            totalScore: totalScores[config.storeId] ?? null,
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

      console.info(JSON.stringify({
        level: 'info',
        service: 'simulationService',
        message: 'Loja processada',
        roundId,
        storeId: config.storeId,
        demandShare: parseFloat((demandShare * 100).toFixed(1)),
        priceScore: priceScores[config.storeId],
        availScore: availScores[config.storeId],
        csatScore: csatScores[config.storeId],
        totalScore: totalScores[config.storeId],
        csat: parseFloat((calcCsat(configNum) * 100).toFixed(1)),
        sla: calcSla(configNum.serviceOperators),
        payroll: calcPayroll(configNum),
        licensing: calcLicensing(configNum),
        capex: calcCapexCost(configNum),
        timestamp: new Date().toISOString(),
      }));
    } catch (err) {
      const error = err as Error;
      console.error(JSON.stringify({
        level: 'error',
        service: 'simulationService',
        message: 'Erro ao processar loja — abortando rodada',
        roundId,
        storeId: config.storeId,
        error: error.message,
        timestamp: new Date().toISOString(),
      }));
      // Propaga o erro para que closeRound reverta o status da rodada para OPEN
      throw err;
    }
  }

  // ─── Gerar relatórios de IA para cada loja (após todos os DREs persistidos) ──
  await generateAiReportsForRound(roundId, enrichedConfigs);
}

interface EnrichedConfigForAi {
  storeId: string;
  roundConfigItems: Array<{ productId: string; margin: { toNumber(): number } | number; salesVolume: number; product: { name: string } }>;
}

function computeMedianMargins(configs: EnrichedConfigForAi[]): Array<{ categoryName: string; medianMargin: number }> {
  const marginsByCategory: Record<string, number[]> = {};
  for (const config of configs) {
    for (const item of config.roundConfigItems) {
      const name = item.product.name;
      if (!marginsByCategory[name]) marginsByCategory[name] = [];
      marginsByCategory[name].push(toNum(item.margin));
    }
  }
  return Object.entries(marginsByCategory).map(([categoryName, margins]) => {
    const sorted = [...margins].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const medianMargin = sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
    return { categoryName, medianMargin };
  });
}

async function generateAiReportsForRound(
  roundId: string,
  configs: EnrichedConfigForAi[]
): Promise<void> {
  const round = await prisma.round.findUnique({ where: { id: roundId } });
  if (!round) return;

  interface FinancialResultRow {
    id: string;
    storeId: string;
    grossRevenue: { toNumber(): number };
    taxes: { toNumber(): number };
    netRevenue: { toNumber(): number };
    costs: { toNumber(): number };
    grossMargin: { toNumber(): number };
    totalBreakage: { toNumber(): number };
    totalAging: { toNumber(): number };
    netMarginMass: { toNumber(): number };
    otherExpenses: { toNumber(): number };
    ebitda: { toNumber(): number };
    ebitdaMargin: { toNumber(): number };
    demandShare: { toNumber(): number };
    store: { name: string; squad: { name: string } };
  }

  const allResults = await prisma.financialResult.findMany({
    where: { roundId },
    include: { store: { include: { squad: { select: { name: true } } } } },
  }) as unknown as FinancialResultRow[];

  const ranking = [...allResults]
    .sort((a, b) => {
      if (toNum(b.ebitdaMargin) !== toNum(a.ebitdaMargin)) return toNum(b.ebitdaMargin) - toNum(a.ebitdaMargin);
      return toNum(b.ebitda) - toNum(a.ebitda);
    })
    .map((r, i) => ({
      position: i + 1,
      squadName: r.store.squad.name,
      ebitdaMargin: toNum(r.ebitdaMargin),
      demandShare: toNum(r.demandShare),
    }));

  const marketAggregates: MarketAggregates = {
    avgEbitdaMargin: allResults.reduce((s, r) => s + toNum(r.ebitdaMargin), 0) / (allResults.length || 1),
    avgDemandShare: allResults.reduce((s, r) => s + toNum(r.demandShare), 0) / (allResults.length || 1),
    avgGrossRevenue: allResults.reduce((s, r) => s + toNum(r.grossRevenue), 0) / (allResults.length || 1),
    medianMarginByCategory: computeMedianMargins(configs),
    totalSquads: allResults.length,
  };

  // Generate player reports in parallel
  await Promise.allSettled(
    allResults.map(async (result) => {
      try {
        const config = configs.find((c) => c.storeId === result.storeId);
        if (!config) return;

        interface HistoryRow {
          ebitda: { toNumber(): number };
          ebitdaMargin: { toNumber(): number };
          grossRevenue: { toNumber(): number };
          demandShare: { toNumber(): number };
          round: { number: number };
        }

        const history = await prisma.financialResult.findMany({
          where: { storeId: result.storeId, roundId: { not: roundId } },
          include: { round: { select: { number: true } } },
          orderBy: { calculatedAt: 'asc' },
          take: 3,
        }) as unknown as HistoryRow[];

        const report = await generateAiReport({
          squadName: result.store.squad.name,
          storeName: result.store.name,
          roundNumber: round.number,
          dre: {
            grossRevenue: toNum(result.grossRevenue),
            taxes: toNum(result.taxes),
            netRevenue: toNum(result.netRevenue),
            costs: toNum(result.costs),
            grossMargin: toNum(result.grossMargin),
            totalBreakage: toNum(result.totalBreakage),
            totalAging: toNum(result.totalAging),
            netMarginMass: toNum(result.netMarginMass),
            otherExpenses: toNum(result.otherExpenses),
            ebitda: toNum(result.ebitda),
            ebitdaMargin: toNum(result.ebitdaMargin),
            demandShare: toNum(result.demandShare),
          },
          decisions: config.roundConfigItems.map((item) => ({
            categoryName: item.product.name,
            margin: toNum(item.margin),
            salesVolume: item.salesVolume,
          })),
          history: history.map((h) => ({
            roundNumber: h.round.number,
            ebitda: toNum(h.ebitda),
            ebitdaMargin: toNum(h.ebitdaMargin),
            grossRevenue: toNum(h.grossRevenue),
            demandShare: toNum(h.demandShare),
          })),
          ranking,
          marketAggregates,
        });

        if (report) {
          await prisma.financialResult.update({
            where: { id: result.id },
            data: { aiReport: report },
          });
        }
      } catch (err) {
        const error = err as Error;
        console.error(JSON.stringify({
          level: 'error',
          service: 'simulationService',
          message: 'Falha ao gerar relatório IA para loja',
          storeId: result.storeId,
          error: error.message,
          timestamp: new Date().toISOString(),
        }));
      }
    })
  );
  console.info(JSON.stringify({ level: 'info', service: 'aiReportService', message: 'Geração de relatórios IA (player) concluída', roundId, timestamp: new Date().toISOString() }));

  // Generate consolidated GM report
  try {
    const gmReport = await generateGmReport({
      roundNumber: round.number,
      allSquadResults: allResults.map((result) => {
        const config = configs.find((c) => c.storeId === result.storeId);
        return {
          squadName: result.store.squad.name,
          storeName: result.store.name,
          dre: {
            grossRevenue: toNum(result.grossRevenue),
            taxes: toNum(result.taxes),
            netRevenue: toNum(result.netRevenue),
            costs: toNum(result.costs),
            grossMargin: toNum(result.grossMargin),
            totalBreakage: toNum(result.totalBreakage),
            totalAging: toNum(result.totalAging),
            netMarginMass: toNum(result.netMarginMass),
            otherExpenses: toNum(result.otherExpenses),
            ebitda: toNum(result.ebitda),
            ebitdaMargin: toNum(result.ebitdaMargin),
            demandShare: toNum(result.demandShare),
          },
          decisions: config
            ? config.roundConfigItems.map((item) => ({
                categoryName: item.product.name,
                margin: toNum(item.margin),
                salesVolume: item.salesVolume,
              }))
            : [],
        };
      }),
      ranking,
      marketAggregates,
    });

    if (gmReport) {
      await prisma.round.update({
        where: { id: roundId },
        data: { aiReportGm: gmReport },
      });
    }
    console.info(JSON.stringify({ level: 'info', service: 'aiReportService', message: 'Relatório GM gerado com sucesso', roundId, timestamp: new Date().toISOString() }));
  } catch (err) {
    const error = err as Error;
    console.error(JSON.stringify({
      level: 'error',
      service: 'simulationService',
      message: 'Falha ao gerar relatório GM',
      roundId,
      error: error.message,
      timestamp: new Date().toISOString(),
    }));
  }
}

// ─── Submit store config ───────────────────────────────────────────────────────

export interface SubmitConfigItem {
  productId: string;
  margin: number;
  salesVolume: number;
  purchasePrice: number;
}

export interface SubmitConfigInput {
  roundId: string;
  storeId: string;
  currentCash: number;
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
  items: SubmitConfigItem[];
  existingConfigId?: string | null;
}

export interface SubmitConfigResult {
  roundConfigId: string;
  stockCost: number;
  capexCost: number;
  interestPenalty: number;
  totalDeduction: number;
}

/**
 * Orquestra a submissão de configuração de uma loja para uma rodada:
 * - Calcula custos (estoque, CAPEX, juros)
 * - Cria RoundConfig e RoundConfigItems
 * - Atualiza inventário e caixa da loja em transação atômica
 */
export async function submitStoreConfig(input: SubmitConfigInput): Promise<SubmitConfigResult> {
  const capexConfig = {
    capexSeguranca: input.capexSeguranca,
    capexBalanca: input.capexBalanca,
    capexRedes: input.capexRedes,
    capexSite: input.capexSite,
    capexSelfCheckout: input.capexSelfCheckout,
    capexMelhoria: input.capexMelhoria,
  };

  const stockCost = input.items.reduce(
    (sum, item) => sum + item.salesVolume * item.purchasePrice,
    0
  );
  const capexCost       = calcCapexCost(capexConfig);
  const interestPenalty = calcInterest(stockCost + capexCost, input.currentCash);
  const totalDeduction  = stockCost + capexCost + interestPenalty;

  const roundConfig = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // If resubmitting, reverse the previous config effects
    if (input.existingConfigId) {
      const oldConfig = await tx.roundConfig.findUnique({
        where: { id: input.existingConfigId },
        include: { roundConfigItems: true },
      });

      if (oldConfig) {
        // Check round number to know if inventory was incremented
        const oldRound = await tx.round.findUnique({ where: { id: input.roundId }, select: { number: true } });

        // Reverse inventory increments from old submission (only if round <= 2)
        if (oldRound && oldRound.number <= 2) {
          await Promise.all(
            oldConfig.roundConfigItems.map((item) =>
              tx.inventory.update({
                where: { storeId_productId: { storeId: input.storeId, productId: item.productId } },
                data: { quantity: { decrement: item.salesVolume } },
              })
            )
          );
        }

        // Compute old deduction to reverse cash
        const oldStockCost = oldConfig.roundConfigItems.reduce(
          (sum: number, item: { salesVolume: number; productId: string }) => sum + item.salesVolume * (input.items.find((i: { productId: string }) => i.productId === item.productId)?.purchasePrice ?? 0),
          0
        );
        const oldCapexCost = calcCapexCost(oldConfig);
        const oldInterest = calcInterest(oldStockCost + oldCapexCost, input.currentCash);
        // In rounds 3+, stockCost was not charged, so only reverse capex+interest
        const oldCashDeduction = (oldRound && oldRound.number <= 2)
          ? (oldStockCost + oldCapexCost + oldInterest)
          : (oldCapexCost + oldInterest);

        // Reverse cash deduction
        await tx.store.update({
          where: { id: input.storeId },
          data: { currentCash: { increment: oldCashDeduction } },
        });

        // Delete old items and config
        await tx.roundConfigItem.deleteMany({ where: { roundConfigId: input.existingConfigId } });
        await tx.roundConfig.delete({ where: { id: input.existingConfigId } });
      }
    }

    const config = await tx.roundConfig.create({
      data: {
        roundId:          input.roundId,
        storeId:          input.storeId,
        otherExpenses:    input.otherExpenses,
        cashierOperators: input.cashierOperators,
        serviceOperators: input.serviceOperators,
        quizScore:        input.quizScore,
        numPdvs:          input.numPdvs,
        capexSeguranca:   input.capexSeguranca,
        capexBalanca:     input.capexBalanca,
        capexRedes:       input.capexRedes,
        capexSite:        input.capexSite,
        capexSelfCheckout: input.capexSelfCheckout,
        capexMelhoria:    input.capexMelhoria,
        roundConfigItems: {
          create: input.items.map(({ productId, margin, salesVolume }) => ({
            productId,
            margin,
            salesVolume,
          })),
        },
      },
      include: { roundConfigItems: true },
    });

    // Only increment inventory and charge stock cost in rounds 1 and 2
    const currentRound = await tx.round.findUnique({ where: { id: input.roundId }, select: { number: true } });
    const canPurchase = currentRound ? currentRound.number <= 2 : true;

    if (canPurchase) {
      await Promise.all(
        input.items.map((item) =>
          tx.inventory.update({
            where: { storeId_productId: { storeId: input.storeId, productId: item.productId } },
            data: { quantity: { increment: item.salesVolume } },
          })
        )
      );
    }

    // Deduct cash: full totalDeduction in rounds 1-2, only capex+interest in rounds 3+
    const cashDeduction = canPurchase ? totalDeduction : (capexCost + interestPenalty);

    await tx.store.update({
      where: { id: input.storeId },
      data: { currentCash: { decrement: cashDeduction } },
    });

    return config;
  });

  return {
    roundConfigId: roundConfig.id,
    stockCost,
    capexCost,
    interestPenalty,
    totalDeduction,
  };
}
