import { z } from 'zod';
import { Request, Response } from 'express';
import roundRepository from '../repositories/roundRepository';
import roundConfigRepository from '../repositories/roundConfigRepository';
import storeRepository from '../repositories/storeRepository';
import productRepository from '../repositories/productRepository';
import inventoryRepository from '../repositories/inventoryRepository';
import { calcularDREPreview, gerarFeedback } from '../services/financeService';
import {
  calcPayroll, calcInterest, calcCsat,
  calcSla, calcLicensing, calcMaintenance, calcCapexCost,
} from '../services/simulationService';
import { getRanking } from '../services/rankingService';
import prisma from '../utils/prisma';
import asyncHandler from '../utils/asyncHandler';

const configSchema = z.object({
  otherExpenses:     z.number().min(0, 'Outros gastos não podem ser negativos'),
  cashierOperators:  z.number().int('Deve ser inteiro').min(0, 'Não pode ser negativo').default(10),
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
        salesVolume: z.number().int('Volume deve ser um inteiro').positive('Volume deve ser positivo'),
      })
    )
    .min(1, 'Informe ao menos um produto'),
});

async function submitConfig(req: Request, res: Response): Promise<void> {
  const { id: roundId } = req.params;
  const { squadId } = req.user!;

  if (!squadId) {
    res.status(400).json({ message: 'Usuário não pertence a um squad' });
    return;
  }

  const store = await storeRepository.findBySquadId(squadId);
  if (!store) {
    res.status(400).json({ message: 'Seu squad não possui uma loja cadastrada' });
    return;
  }

  const round = await roundRepository.findById(roundId);
  if (!round) {
    res.status(404).json({ message: 'Rodada não encontrada' });
    return;
  }

  if (round.status !== 'OPEN') {
    res.status(409).json({
      message: `Não é possível submeter configuração: rodada está com status "${round.status}"`,
    });
    return;
  }

  const existingConfig = await roundConfigRepository.findByRoundAndStore(roundId, store.id);
  if (existingConfig) {
    res.status(409).json({ message: 'Você já submeteu uma configuração para esta rodada' });
    return;
  }

  const parsed = configSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
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
    res.status(400).json({ message: 'Existem produtos duplicados nos items' });
    return;
  }

  const existingProducts = await Promise.all(uniqueIds.map((id) => productRepository.findById(id)));
  const missingProducts = uniqueIds.filter((id, idx) => !existingProducts[idx]);
  if (missingProducts.length > 0) {
    res.status(400).json({
      message: 'Produtos não encontrados',
      missingProductIds: missingProducts,
    });
    return;
  }

  const productMap = Object.fromEntries(
    existingProducts.filter(Boolean).map((p) => [p!.id, p!])
  );

  const capexConfig = { capexSeguranca, capexBalanca, capexRedes, capexSite, capexSelfCheckout, capexMelhoria };
  const stockCost = items.reduce(
    (sum, item) => sum + item.salesVolume * (productMap[item.productId]?.purchasePrice ?? 0),
    0
  );
  const capexCost       = calcCapexCost(capexConfig);
  const interestPenalty = calcInterest(stockCost + capexCost, store.currentCash);
  const totalDeduction  = stockCost + capexCost + interestPenalty;

  const roundConfig = await prisma.$transaction(async (tx) => {
    const config = await tx.roundConfig.create({
      data: {
        roundId,
        storeId:          store.id,
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

    await Promise.all(
      items.map((item) =>
        tx.inventory.update({
          where: { storeId_productId: { storeId: store.id, productId: item.productId } },
          data: { quantity: { increment: item.salesVolume } },
        })
      )
    );

    await tx.store.update({
      where: { id: store.id },
      data: { currentCash: { decrement: totalDeduction } },
    });

    return config;
  });

  res.status(201).json({
    roundConfigId:     roundConfig.id,
    storeId:           store.id,
    roundId,
    otherExpenses:     roundConfig.otherExpenses,
    cashierOperators:  roundConfig.cashierOperators,
    serviceOperators:  roundConfig.serviceOperators,
    quizScore:         roundConfig.quizScore,
    numPdvs:           roundConfig.numPdvs,
    capexSeguranca:    roundConfig.capexSeguranca,
    capexBalanca:      roundConfig.capexBalanca,
    capexRedes:        roundConfig.capexRedes,
    capexSite:         roundConfig.capexSite,
    capexSelfCheckout: roundConfig.capexSelfCheckout,
    capexMelhoria:     roundConfig.capexMelhoria,
    submittedAt:       roundConfig.submittedAt,
    stockCost,
    capexCost,
    interestPenalty,
    totalDeduction,
    items:             roundConfig.roundConfigItems,
  });
}

async function previewConfig(req: Request, res: Response): Promise<void> {
  const { squadId } = req.user!;

  if (!squadId) {
    res.status(400).json({ message: 'Usuário não pertence a um squad' });
    return;
  }

  const store = await storeRepository.findBySquadId(squadId);
  if (!store) {
    res.status(400).json({ message: 'Seu squad não possui uma loja cadastrada' });
    return;
  }

  const parsed = configSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
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
    res.status(400).json({ message: 'Produtos não encontrados', missingProductIds: missingProducts });
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
    (sum, item) => sum + item.salesVolume * (productMap[item.productId]?.purchasePrice ?? 0),
    0
  );

  const currentCash     = store.currentCash;
  const totalOutlay     = stockCost + capexCost;
  const interestPenalty = calcInterest(totalOutlay, currentCash);
  const totalOtherExpenses = otherExpenses + payroll + licensing + maintenance + interestPenalty;

  const roundConfig = { otherExpenses: totalOtherExpenses };

  const itemsForEngine = items.map((item) => ({
    productId:   item.productId,
    margin:      item.margin,
    salesVolume: item.salesVolume,
    product: {
      purchasePrice: productMap[item.productId].purchasePrice,
      taxRate:       productMap[item.productId].taxRate,
      breakageRate:  productMap[item.productId].breakageRate,
      agingRate:     productMap[item.productId].agingRate,
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
    initialCapital: store.initialCapital,
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
    res.status(400).json({ message: 'Parâmetro roundId é obrigatório' });
    return;
  }

  const ranking = await getRanking(roundId);
  res.status(200).json(ranking);
}

async function getResults(req: Request, res: Response): Promise<void> {
  const { id: roundId } = req.params;
  const { role, squadId } = req.user!;

  const round = await roundRepository.findById(roundId);
  if (!round) {
    res.status(404).json({ message: 'Rodada não encontrada' });
    return;
  }

  if (round.status !== 'CLOSED') {
    res.status(404).json({ message: 'Resultados disponíveis apenas após o encerramento da rodada' });
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
    res.status(200).json(results);
    return;
  }

  if (!squadId) {
    res.status(400).json({ message: 'Usuário não pertence a um squad' });
    return;
  }

  const store = await storeRepository.findBySquadId(squadId);
  if (!store) {
    res.status(400).json({ message: 'Seu squad não possui uma loja cadastrada' });
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
    res.status(404).json({ message: 'Resultado não encontrado para sua loja nesta rodada' });
    return;
  }

  res.status(200).json(result);
}

export default {
  submitConfig: asyncHandler(submitConfig),
  previewConfig: asyncHandler(previewConfig),
  getRanking: asyncHandler(getRankingHandler),
  getResults: asyncHandler(getResults),
};
