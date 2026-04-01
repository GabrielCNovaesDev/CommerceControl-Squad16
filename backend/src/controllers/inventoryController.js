const { z } = require('zod');
const inventoryRepository = require('../repositories/inventoryRepository');
const storeRepository = require('../repositories/storeRepository');
const asyncHandler = require('../utils/asyncHandler');

const updateQuantitySchema = z.object({
  quantity: z.int('Quantidade deve ser um número inteiro').min(0, 'Quantidade não pode ser negativa'),
});

const restockSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid('productId inválido'),
        quantity: z.int('Quantidade deve ser um número inteiro').min(0, 'Quantidade não pode ser negativa'),
      })
    )
    .min(1, 'Informe ao menos um produto'),
});

async function getInventory(req, res) {
  const { storeId } = req.params;
  const { id: userId, role, squadId } = req.user;

  const store = await storeRepository.findById(storeId);
  if (!store) {
    return res.status(404).json({ message: 'Loja não encontrada' });
  }

  if (role === 'PLAYER' && store.squadId !== squadId) {
    return res.status(403).json({ message: 'Acesso negado: loja não pertence ao seu squad' });
  }

  const inventory = await inventoryRepository.findByStoreId(storeId);
  return res.status(200).json(inventory);
}

async function updateInventoryItem(req, res) {
  const { storeId, productId } = req.params;

  const store = await storeRepository.findById(storeId);
  if (!store) {
    return res.status(404).json({ message: 'Loja não encontrada' });
  }

  const parsed = updateQuantitySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
  }

  const existing = await inventoryRepository.findByStoreAndProduct(storeId, productId);
  if (!existing) {
    return res.status(404).json({ message: 'Produto não encontrado no estoque desta loja' });
  }

  const updated = await inventoryRepository.updateQuantity(storeId, productId, parsed.data.quantity);
  return res.status(200).json(updated);
}

async function restockInventory(req, res) {
  const { storeId } = req.params;

  const store = await storeRepository.findById(storeId);
  if (!store) {
    return res.status(404).json({ message: 'Loja não encontrada' });
  }

  const parsed = restockSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
  }

  const updated = await inventoryRepository.bulkUpdateQuantity(storeId, parsed.data.items);
  return res.status(200).json(updated);
}

module.exports = {
  getInventory: asyncHandler(getInventory),
  updateInventoryItem: asyncHandler(updateInventoryItem),
  restockInventory: asyncHandler(restockInventory),
};
