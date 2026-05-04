import { z } from 'zod';
import { Request, Response } from 'express';
import storeRepository from '../repositories/storeRepository';
import productRepository from '../repositories/productRepository';
import prisma from '../utils/prisma';
import asyncHandler from '../utils/asyncHandler';

const createSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  initialCapital: z.number().positive('Capital inicial deve ser positivo'),
});

async function getMyStore(req: Request, res: Response): Promise<void> {
  const { squadId } = req.user!;
  if (!squadId) {
    res.status(400).json({ message: 'Usuário não pertence a um squad' });
    return;
  }

  const store = await storeRepository.findBySquadId(squadId);
  if (!store) {
    res.status(404).json({ message: 'Loja não encontrada para este squad' });
    return;
  }

  res.status(200).json(store);
}

async function createStore(req: Request, res: Response): Promise<void> {
  const { squadId } = req.user!;
  if (!squadId) {
    res.status(400).json({ message: 'Usuário não pertence a um squad' });
    return;
  }

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    return;
  }

  const existing = await storeRepository.findBySquadId(squadId);
  if (existing) {
    res.status(409).json({ message: 'Este squad já possui uma loja' });
    return;
  }

  const store = await storeRepository.create({
    ...parsed.data,
    squadId,
    currentCash: parsed.data.initialCapital,
  });

  const products = await productRepository.findAll();
  if (products.length > 0) {
    await prisma.inventory.createMany({
      data: products.map((p) => ({
        storeId: store.id,
        productId: p.id,
        quantity: 0,
      })),
    });
  }

  res.status(201).json(store);
}

async function listStores(req: Request, res: Response): Promise<void> {
  const stores = await storeRepository.findAll();
  res.status(200).json(stores);
}

export default {
  getMyStore: asyncHandler(getMyStore),
  createStore: asyncHandler(createStore),
  listStores: asyncHandler(listStores),
};
