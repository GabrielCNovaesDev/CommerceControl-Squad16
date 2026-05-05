import { z } from 'zod';
import { Request, Response } from 'express';
import inventoryRepository from '../repositories/inventoryRepository';
import storeRepository from '../repositories/storeRepository';
import asyncHandler from '../utils/asyncHandler';
import { sendError } from '../utils/errorResponse';

const updateQuantitySchema = z.object({
  quantity: z.number().int('Quantidade deve ser um número inteiro').min(0, 'Quantidade não pode ser negativa'),
});

const restockSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1, 'productId é obrigatório'),
        quantity: z.number().int('Quantidade deve ser um número inteiro').min(0, 'Quantidade não pode ser negativa'),
      })
    )
    .min(1, 'Informe ao menos um produto'),
});

async function getInventory(req: Request, res: Response): Promise<void> {
  const storeId = String(req.params.storeId);
  const { role, squadId } = req.user!;

  const store = await storeRepository.findById(storeId);
  if (!store) {
    sendError(res, 404, 'STORE_NOT_FOUND', 'Loja não encontrada');
    return;
  }

  if (role === 'PLAYER' && store.squadId !== squadId) {
    sendError(res, 403, 'FORBIDDEN', 'Acesso negado: loja não pertence ao seu squad');
    return;
  }

  const inventory = await inventoryRepository.findByStoreId(storeId);
  res.status(200).json(inventory);
}

async function updateInventoryItem(req: Request, res: Response): Promise<void> {
  const storeId = String(req.params.storeId);
  const productId = String(req.params.productId);

  const store = await storeRepository.findById(storeId);
  if (!store) {
    sendError(res, 404, 'STORE_NOT_FOUND', 'Loja não encontrada');
    return;
  }

  const parsed = updateQuantitySchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Dados inválidos', parsed.error.flatten().fieldErrors);
    return;
  }

  const existing = await inventoryRepository.findByStoreAndProduct(storeId, productId);
  if (!existing) {
    sendError(res, 404, 'INVENTORY_ITEM_NOT_FOUND', 'Produto não encontrado no estoque desta loja');
    return;
  }

  const updated = await inventoryRepository.updateQuantity(storeId, productId, parsed.data.quantity);
  res.status(200).json(updated);
}

async function restockInventory(req: Request, res: Response): Promise<void> {
  const storeId = String(req.params.storeId);

  const store = await storeRepository.findById(storeId);
  if (!store) {
    sendError(res, 404, 'STORE_NOT_FOUND', 'Loja não encontrada');
    return;
  }

  const parsed = restockSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Dados inválidos', parsed.error.flatten().fieldErrors);
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
