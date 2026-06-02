import { z } from 'zod';
import { Request, Response } from 'express';
import roundRepository from '../repositories/roundRepository';
import roundConfigRepository from '../repositories/roundConfigRepository';
import storeRepository from '../repositories/storeRepository';
import productRepository from '../repositories/productRepository';
import inventoryRepository from '../repositories/inventoryRepository';
import { calcularDREPreview, gerarFeedback } from '../services/financeService';
import {
  calcPayroll, calcCsat,
  calcSla, calcLicensing, calcMaintenance, calcCapexCost, calcInterest,
  submitStoreConfig,
} from '../services/simulationService';
import gameSettingsRepository from '../repositories/gameSettingsRepository';
import { getRanking } from '../services/rankingService';
import prisma, { toNum } from '../utils/prisma';
import asyncHandler from '../utils/asyncHandler';
import { sendError } from '../utils/errorResponse';

const configSchema = z.object({
  otherExpenses:     z.number().min(0, 'Outros gastos não podem ser negativos'),
  cashierOperators:  z.number().int('Deve ser inteiro').min(0, 'Não pode ser negativo').max(10, 'Máximo 10 operadores de caixa').default(10),
  serviceOperators:  z.number().int('Deve ser inteiro').min(0, 'Não pode ser negativo').default(5),
  quizScore:         z.number().min(0, 'Mínimo 0').max(1, 'Máximo 1').default(1.0),
  numPdvs:           z.number().int('Deve ser inteiro').min(0).default(6),
  capexSeguranca:    z.boolean().default(false),
  capexBalanca:      z.boolean().default(false),
  capexRedes:        z.boolean().default(false),
  capexSite:         z.boolean().default(false),
  capexSelfCheckout: z.boolean().default(false),
  capexMelhoria:     z.boolean().default(false),
  items: z
    .array(
      z.object({
        productId:   z.string().min(1, 'productId é obrigatório'),
        margin:      z.number().min(0, 'Margem não pode ser negativa'),
        salesVolume: z.number().int('Volume deve ser um inteiro').min(0, 'Volume não pode ser negativo'),
      })
    )
    .min(1, 'Informe ao menos um produto'),
});

async function submitConfig(req: Request, res: Response): Promise<void> {
  const roundId = String(req.params.id);
  const { squadId } = req.user!;

  if (!squadId) {
    sendError(res, 400, 'NO_SQUAD', 'Usuário não pertence a um squad');
    return;
  }

  const store = await storeRepository.findBySquadId(squadId);
  if (!store) {
    sendError(res, 400, 'NO_STORE', 'Seu squad não possui uma loja cadastrada');
    return;
  }

  const round = await roundRepository.findById(roundId);
  if (!round) {
    sendError(res, 404, 'ROUND_NOT_FOUND', 'Rodada não encontrada');
    return;
  }

  if (round.status !== 'OPEN') {
    sendError(res, 409, 'ROUND_NOT_OPEN', `Não é possível submeter configuração: rodada está com status "${round.status}"`);
    return;
  }

  const existingConfig = await roundConfigRepository.findByRoundAndStore(roundId, store.id);

  const parsed = configSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Dados inválidos', parsed.error.flatten().fieldErrors);
    return;
  }

  const {
    otherExpenses, cashierOperators, serviceOperators, quizScore,
    numPdvs, capexSeguranca, capexBalanca, capexRedes, capexSite, capexSelfCheckout, capexMelhoria,
    items,
  } = parsed.data;

  const productIds = items.map((i) => i.productId);
  const uniqueIds = [...new Set(productIds)];
  if (uniqueIds.length !== productIds.length) {
    sendError(res, 400, 'DUPLICATE_PRODUCTS', 'Existem produtos duplicados nos items');
    return;
  }

  const existingProducts = await Promise.all(uniqueIds.map((id) => productRepository.findById(id)));
  const missingProducts = uniqueIds.filter((id, idx) => !existingProducts[idx]);
  if (missingProducts.length > 0) {
    sendError(res, 400, 'PRODUCTS_NOT_FOUND', 'Produtos não encontrados', missingProducts.map((id) => ({ field: 'productId', message: id })));
    return;
  }

  // CAPEX validation: max 1 per round, no repeats across rounds
  const capexKeys = ['capexSeguranca', 'capexBalanca', 'capexRedes', 'capexSite', 'capexSelfCheckout', 'capexMelhoria'] as const;
  const selectedCapex = capexKeys.filter((k) => parsed.data[k]);

  if (selectedCapex.length > 1) {
    sendError(res, 400, 'MAX_ONE_CAPEX', 'Máximo 1 investimento CAPEX por rodada');
    return;
  }

  if (selectedCapex.length === 1) {
    const previousConfigs = await roundConfigRepository.findCapexByStore(store.id);
    // Exclude current round's config (in case of resubmission)
    const pastConfigs = previousConfigs.filter((c: { roundId: string }) => c.roundId !== roundId);
    const usedCapex = capexKeys.filter((k) => pastConfigs.some((c: Record<string, boolean>) => c[k]));

    if (usedCapex.includes(selectedCapex[0])) {
      sendError(res, 400, 'CAPEX_ALREADY_USED', 'Este CAPEX já foi investido em uma rodada anterior');
      return;
    }
  }

  const productMap = Object.fromEntries(
    existingProducts.filter(Boolean).map((p) => [p!.id, p!])
  );

  // Delega cálculo e persistência ao service (seção 2.1 AGENTS.md)
  const result = await submitStoreConfig({
    roundId,
    storeId: store.id,
    currentCash: toNum(store.currentCash),
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
    items: items.map((item) => ({
      productId: item.productId,
      margin: item.margin,
      salesVolume: item.salesVolume,
      purchasePrice: productMap[item.productId]?.purchasePrice ? toNum(productMap[item.productId]!.purchasePrice) : 0,
    })),
    existingConfigId: existingConfig?.id ?? null,
  });

  res.status(201).json({
    roundConfigId:    result.roundConfigId,
    storeId:          store.id,
    roundId,
    stockCost:        result.stockCost,
    capexCost:        result.capexCost,
    interestPenalty:  result.interestPenalty,
    totalDeduction:   result.totalDeduction,
  });
}

async function previewConfig(req: Request, res: Response): Promise<void> {
  const { squadId } = req.user!;

  if (!squadId) {
    sendError(res, 400, 'NO_SQUAD', 'Usuário não pertence a um squad');
    return;
  }

  const store = await storeRepository.findBySquadId(squadId);
  if (!store) {
    sendError(res, 400, 'NO_STORE', 'Seu squad não possui uma loja cadastrada');
    return;
  }

  const parsed = configSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Dados inválidos', parsed.error.flatten().fieldErrors);
    return;
  }

  const {
    otherExpenses, cashierOperators, serviceOperators, quizScore,
    numPdvs, capexSeguranca, capexBalanca, capexRedes, capexSite, capexSelfCheckout, capexMelhoria,
    items,
  } = parsed.data;

  const productIds = [...new Set(items.map((i) => i.productId))];
  const foundProducts = await Promise.all(productIds.map((id) => productRepository.findById(id)));
  const missingProducts = productIds.filter((id, idx) => !foundProducts[idx]);
  if (missingProducts.length > 0) {
    sendError(res, 400, 'PRODUCTS_NOT_FOUND', 'Produtos não encontrados', missingProducts.map((id) => ({ field: 'productId', message: id })));
    return;
  }

  const productMap = Object.fromEntries(foundProducts.map((p) => [p!.id, p!]));

  const realInventoryList = await inventoryRepository.findByStoreId(store.id);
  const realInventoryMap = Object.fromEntries(
    realInventoryList.map((inv) => [inv.productId, inv.quantity])
  );

  const configForCalc = {
    cashierOperators, serviceOperators, quizScore,
    numPdvs, capexSeguranca, capexBalanca, capexRedes, capexSite, capexSelfCheckout, capexMelhoria,
  };

  const csat        = calcCsat(configForCalc);
  const sla         = calcSla(serviceOperators);
  const payroll     = calcPayroll(configForCalc);
  const licensing   = calcLicensing(configForCalc);
  const maintenance = calcMaintenance(configForCalc);
  const capexCost   = calcCapexCost(configForCalc);

  const stockCost = items.reduce(
    (sum, item) => sum + item.salesVolume * (productMap[item.productId]?.purchasePrice ? toNum(productMap[item.productId]!.purchasePrice) : 0),
    0
  );

  const currentCash     = toNum(store.currentCash);
  const totalOutlay     = stockCost + capexCost;
  const interestPenalty = calcInterest(totalOutlay, currentCash);
  const totalOtherExpenses = otherExpenses + payroll + interestPenalty;

  const roundConfig = { otherExpenses: totalOtherExpenses };

  const itemsForEngine = items.map((item) => ({
    productId:   item.productId,
    margin:      item.margin,
    salesVolume: item.salesVolume,
    product: {
      purchasePrice: toNum(productMap[item.productId].purchasePrice),
      taxRate:       toNum(productMap[item.productId].taxRate),
      breakageRate:  toNum(productMap[item.productId].breakageRate),
      agingRate:     toNum(productMap[item.productId].agingRate),
    },
  }));

  const inventoryForPreview = items.map((item) => ({
    productId: item.productId,
    quantity:  (realInventoryMap[item.productId] ?? 0) + item.salesVolume,
  }));

  const dre       = calcularDREPreview(roundConfig, itemsForEngine, inventoryForPreview);
  const feedbacks = gerarFeedback(dre);

  const cashSummary = {
    currentCash,
    initialCapital: toNum(store.initialCapital),
    stockCost,
    capexCost,
    payroll,
    licensing,
    maintenance,
    interestPenalty,
    balance: currentCash - totalOutlay,
    cashOk:  totalOutlay <= currentCash,
    csat,
    sla,
  };

  res.status(200).json({ dre, feedbacks, cashSummary, preview: true });
}

async function getRankingHandler(req: Request, res: Response): Promise<void> {
  const { roundId } = req.query as { roundId?: string };

  if (!roundId) {
    sendError(res, 400, 'MISSING_PARAM', 'Parâmetro roundId é obrigatório');
    return;
  }

  const ranking = await getRanking(roundId);
  res.status(200).json(ranking);
}

async function getResults(req: Request, res: Response): Promise<void> {
  const roundId = String(req.params.id);
  const { role, squadId } = req.user!;

  const round = await roundRepository.findById(roundId);
  if (!round) {
    sendError(res, 404, 'ROUND_NOT_FOUND', 'Rodada não encontrada');
    return;
  }

  if (round.status !== 'CLOSED') {
    sendError(res, 404, 'RESULTS_NOT_AVAILABLE', 'Resultados disponíveis apenas após o encerramento da rodada');
    return;
  }

  if (role === 'GAME_MASTER') {
    const results = await prisma.financialResult.findMany({
      where: { roundId },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            squadId: true,
            squad: { select: { id: true, name: true } },
          },
        },
      },
    });

    const roundData = await prisma.round.findUnique({
      where: { id: roundId },
      select: { aiReportGm: true },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const sanitizedResults = results.map(({ aiReport: _aiReport, ...rest }: typeof results[number]) => rest);

    res.status(200).json({
      results: sanitizedResults,
      aiReportGm: roundData?.aiReportGm ?? null,
    });
    return;
  }

  if (!squadId) {
    sendError(res, 400, 'NO_SQUAD', 'Usuário não pertence a um squad');
    return;
  }

  const store = await storeRepository.findBySquadId(squadId);
  if (!store) {
    sendError(res, 400, 'NO_STORE', 'Seu squad não possui uma loja cadastrada');
    return;
  }

  const result = await prisma.financialResult.findFirst({
    where: { roundId, storeId: store.id },
    include: {
      store: { select: { id: true, name: true, squadId: true } },
      roundConfig: {
        include: {
          roundConfigItems: {
            include: {
              product: { select: { id: true, name: true, purchasePrice: true } },
            },
          },
        },
      },
    },
  });

  if (!result) {
    sendError(res, 404, 'RESULT_NOT_FOUND', 'Resultado não encontrado para sua loja nesta rodada');
    return;
  }

  res.status(200).json(result);
}

async function getMyConfig(req: Request, res: Response): Promise<void> {
  const roundId = String(req.params.id);
  const { squadId } = req.user!;

  if (!squadId) {
    sendError(res, 400, 'NO_SQUAD', 'Usuário não pertence a um squad');
    return;
  }

  const store = await storeRepository.findBySquadId(squadId);
  if (!store) {
    sendError(res, 400, 'NO_STORE', 'Seu squad não possui uma loja cadastrada');
    return;
  }

  const config = await roundConfigRepository.findByRoundAndStore(roundId, store.id);
  if (!config) {
    sendError(res, 404, 'CONFIG_NOT_FOUND', 'Nenhuma configuração encontrada para esta rodada');
    return;
  }

  res.status(200).json(config);
}

export default {
  submitConfig: asyncHandler(submitConfig),
  previewConfig: asyncHandler(previewConfig),
  getRanking: asyncHandler(getRankingHandler),
  getResults: asyncHandler(getResults),
  getMyConfig: asyncHandler(getMyConfig),
};
