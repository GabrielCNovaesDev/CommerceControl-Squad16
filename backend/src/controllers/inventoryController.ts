import { z } from 'zod';
import { Request, Response } from 'express';
import inventoryRepository from '../repositories/inventoryRepository';
import storeRepository from '../repositories/storeRepository';
import asyncHandler from '../utils/asyncHandler';

const updateQuantitySchema = z.object({
  quantity: z.number().int('Quantidade deve ser um número inteiro').min(0, 'Quantidade não pode ser negativa'),
});

const restockSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid('productId inválido'),
        quantity: z.number().int('Quantidade deve ser um número inteiro').min(0, 'Quantidade não pode ser negativa'),
      })
    )
    .min(1, 'Informe ao menos um produto'),
});

async function getInventory(req: Request, res: Response): Promise<void> {
  const { storeId } = req.params;
  const { role, squadId } = req.user!;

  const store = await storeRepository.findById(storeId);
  if (!store) {
    res.status(404).json({ message: 'Loja não encontrada' });
    return;
  }

  if (role === 'PLAYER' && store.squadId !== squadId) {
    res.status(403).json({ message: 'Acesso negado: loja não pertence ao seu squad' });
    return;
  }

  const inventory = await inventoryRepository.findByStoreId(storeId);
  res.status(200).json(inventory);
}

async function updateInventoryItem(req: Request, res: Response): Promise<void> {
  const { storeId, productId } = req.params;

  const store = await storeRepository.findById(storeId);
  if (!store) {
    res.status(404).json({ message: 'Loja não encontrada' });
    return;
  }

  const parsed = updateQuantitySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    return;
  }

  const existing = await inventoryRepository.findByStoreAndProduct(storeId, productId);
  if (!existing) {
    res.status(404).json({ message: 'Produto não encontrado no estoque desta loja' });
    return;
  }

  const updated = await inventoryRepository.updateQuantity(storeId, productId, parsed.data.quantity);
  res.status(200).json(updated);
}

async function restockInventory(req: Request, res: Response): Promise<void> {
  const { storeId } = req.params;

  const store = await storeRepository.findById(storeId);
  if (!store) {
    res.status(404).json({ message: 'Loja não encontrada' });
    return;
  }

  const parsed = restockSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    return;
  }

  const updated = await inventoryRepository.bulkUpdateQuantity(storeId, parsed.data.items);
  res.status(200).json(updated);
}

export default {
  getInventory: asyncHandler(getInventory),
  updateInventoryItem: asyncHandler(updateInventoryItem),
  restockInventory: asyncHandler(restockInventory),
};
