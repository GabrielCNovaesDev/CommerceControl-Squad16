const { z } = require('zod');
const roundRepository = require('../repositories/roundRepository');
const roundConfigRepository = require('../repositories/roundConfigRepository');
const storeRepository = require('../repositories/storeRepository');
const productRepository = require('../repositories/productRepository');
const inventoryRepository = require('../repositories/inventoryRepository');
const { calcularDREPreview, gerarFeedback } = require('../services/financeService');
const rankingService = require('../services/rankingService');
const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('../utils/asyncHandler');

const prisma = new PrismaClient();

const configSchema = z.object({
  fixedExpenses: z.number().min(0, 'Despesas fixas não podem ser negativas'),
  variableExpenses: z.number().min(0, 'Despesas variáveis não podem ser negativas'),
  items: z
    .array(
      z.object({
        productId: z.string().uuid('productId inválido'),
        salePrice: z.number().positive('Preço de venda deve ser positivo'),
        salesVolume: z.int('Volume deve ser um inteiro').positive('Volume deve ser positivo'),
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

  const { fixedExpenses, variableExpenses, items } = parsed.data;

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

  const roundConfig = await roundConfigRepository.create(
    roundId,
    store.id,
    fixedExpenses,
    variableExpenses,
    items
  );

  return res.status(201).json({
    roundConfigId: roundConfig.id,
    storeId: store.id,
    roundId,
    fixedExpenses: roundConfig.fixedExpenses,
    variableExpenses: roundConfig.variableExpenses,
    submittedAt: roundConfig.submittedAt,
    items: roundConfig.roundConfigItems,
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

  const { fixedExpenses, variableExpenses, items } = parsed.data;

  const productIds = [...new Set(items.map((i) => i.productId))];
  const foundProducts = await Promise.all(productIds.map((id) => productRepository.findById(id)));
  const missingProducts = productIds.filter((id, idx) => !foundProducts[idx]);
  if (missingProducts.length > 0) {
    return res.status(400).json({ message: 'Produtos não encontrados', missingProductIds: missingProducts });
  }

  const purchasePriceMap = Object.fromEntries(
    foundProducts.map((p) => [p.id, p.purchasePrice])
  );

  const inventoryList = await inventoryRepository.findByStoreId(store.id);

  const roundConfig = { fixedExpenses, variableExpenses };

  const itemsForEngine = items.map((item) => ({
    productId: item.productId,
    salePrice: item.salePrice,
    salesVolume: item.salesVolume,
    product: { purchasePrice: purchasePriceMap[item.productId] },
  }));

  const inventory = inventoryList.map((inv) => ({
    productId: inv.productId,
    quantity: inv.quantity,
  }));

  const dre = calcularDREPreview(roundConfig, itemsForEngine, inventory);
  const feedbacks = gerarFeedback(dre);

  return res.status(200).json({ dre, feedbacks, preview: true });
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
        store: { select: { id: true, name: true, squadId: true } },
      },
    });
    return res.status(200).json(results);
  }

  // PLAYER — somente resultado da própria loja
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
