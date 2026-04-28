const { z } = require('zod');
const roundRepository = require('../repositories/roundRepository');
const roundConfigRepository = require('../repositories/roundConfigRepository');
const storeRepository = require('../repositories/storeRepository');
const productRepository = require('../repositories/productRepository');
const inventoryRepository = require('../repositories/inventoryRepository');
const { calcularDREPreview, gerarFeedback } = require('../services/financeService');
const {
  calcPayroll, calcInterest, calcCsat,
  calcSla, calcLicensing, calcMaintenance, calcCapexCost,
} = require('../services/simulationService');
const rankingService = require('../services/rankingService');
const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('../utils/asyncHandler');

const prisma = new PrismaClient();

const configSchema = z.object({
  otherExpenses:     z.number().min(0, 'Outros gastos não podem ser negativos'),
  cashierOperators:  z.number().int('Deve ser inteiro').min(0, 'Não pode ser negativo').default(10),
  serviceOperators:  z.number().int('Deve ser inteiro').min(0, 'Não pode ser negativo').default(5),
  quizScore:         z.number().min(0, 'Mínimo 0').max(1, 'Máximo 1').default(1.0),
  // CAPEX & Licensing
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

async function submitConfig(req, res) {
  const { id: roundId } = req.params;
  const { squadId } = req.user;

  if (!squadId) {
    return res.status(400).json({ message: 'Usuário não pertence a um squad' });
  }

  const store = await storeRepository.findBySquadId(squadId);
  if (!store) {
    return res.status(400).json({ message: 'Seu squad não possui uma loja cadastrada' });
  }

  const round = await roundRepository.findById(roundId);
  if (!round) {
    return res.status(404).json({ message: 'Rodada não encontrada' });
  }

  if (round.status !== 'OPEN') {
    return res.status(409).json({
      message: `Não é possível submeter configuração: rodada está com status "${round.status}"`,
    });
  }

  const existingConfig = await roundConfigRepository.findByRoundAndStore(roundId, store.id);
  if (existingConfig) {
    return res.status(409).json({ message: 'Você já submeteu uma configuração para esta rodada' });
  }

  const parsed = configSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
  }

  const {
    otherExpenses, cashierOperators, serviceOperators, quizScore,
    numPdvs, capexSeguranca, capexBalanca, capexRedes, capexSite, capexSelfCheckout, capexMelhoria,
    items,
  } = parsed.data;

  const productIds = items.map((i) => i.productId);
  const uniqueIds = [...new Set(productIds)];
  if (uniqueIds.length !== productIds.length) {
    return res.status(400).json({ message: 'Existem produtos duplicados nos items' });
  }

  const existingProducts = await Promise.all(uniqueIds.map((id) => productRepository.findById(id)));
  const missingProducts = uniqueIds.filter((id, idx) => !existingProducts[idx]);
  if (missingProducts.length > 0) {
    return res.status(400).json({
      message: 'Produtos não encontrados',
      missingProductIds: missingProducts,
    });
  }

  const productMap = Object.fromEntries(
    existingProducts.filter(Boolean).map((p) => [p.id, p])
  );

  // Pre-compute costs for cash deduction
  const capexConfig = { capexSeguranca, capexBalanca, capexRedes, capexSite, capexSelfCheckout, capexMelhoria };
  const stockCost = items.reduce(
    (sum, item) => sum + item.salesVolume * (productMap[item.productId]?.purchasePrice ?? 0),
    0
  );
  const capexCost       = calcCapexCost(capexConfig);
  const interestPenalty = calcInterest(stockCost + capexCost, store.currentCash);
  const totalDeduction  = stockCost + capexCost + interestPenalty;

  // Atomic: create config + increment inventory + deduct cash
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

    // Increment inventory by salesVolume (stock purchase)
    await Promise.all(
      items.map((item) =>
        tx.inventory.update({
          where: { storeId_productId: { storeId: store.id, productId: item.productId } },
          data: { quantity: { increment: item.salesVolume } },
        })
      )
    );

    // Deduct cash (stockCost + capexCost + interest)
    await tx.store.update({
      where: { id: store.id },
      data: { currentCash: { decrement: totalDeduction } },
    });

    return config;
  });

  return res.status(201).json({
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

async function previewConfig(req, res) {
  const { squadId } = req.user;

  if (!squadId) {
    return res.status(400).json({ message: 'Usuário não pertence a um squad' });
  }

  const store = await storeRepository.findBySquadId(squadId);
  if (!store) {
    return res.status(400).json({ message: 'Seu squad não possui uma loja cadastrada' });
  }

  const parsed = configSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
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
    return res.status(400).json({ message: 'Produtos não encontrados', missingProductIds: missingProducts });
  }

  const productMap = Object.fromEntries(foundProducts.map((p) => [p.id, p]));

  // Fetch current inventory to add to the purchased quantities for the DRE preview
  const realInventoryList = await inventoryRepository.findByStoreId(store.id);
  const realInventoryMap  = Object.fromEntries(
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

  // Use currentCash (not initialCapital) — accounts for previous round purchases
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

  // Preview inventory = existing stock + additional purchase
  // This ensures round 1 (inventory=0 + salesVolume) and round 2 (leftover + new buy) both work
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

  return res.status(200).json({ dre, feedbacks, cashSummary, preview: true });
}

async function getRanking(req, res) {
  const { roundId } = req.query;

  if (!roundId) {
    return res.status(400).json({ message: 'Parâmetro roundId é obrigatório' });
  }

  const ranking = await rankingService.getRanking(roundId);
  return res.status(200).json(ranking);
}

async function getResults(req, res) {
  const { id: roundId } = req.params;
  const { role, squadId } = req.user;

  const round = await roundRepository.findById(roundId);
  if (!round) {
    return res.status(404).json({ message: 'Rodada não encontrada' });
  }

  if (round.status !== 'CLOSED') {
    return res.status(404).json({ message: 'Resultados disponíveis apenas após o encerramento da rodada' });
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
    return res.status(200).json(results);
  }

  if (!squadId) {
    return res.status(400).json({ message: 'Usuário não pertence a um squad' });
  }

  const store = await storeRepository.findBySquadId(squadId);
  if (!store) {
    return res.status(400).json({ message: 'Seu squad não possui uma loja cadastrada' });
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
    return res.status(404).json({ message: 'Resultado não encontrado para sua loja nesta rodada' });
  }

  return res.status(200).json(result);
}

module.exports = {
  submitConfig: asyncHandler(submitConfig),
  previewConfig: asyncHandler(previewConfig),
  getRanking: asyncHandler(getRanking),
  getResults: asyncHandler(getResults),
};
