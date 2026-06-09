import { z } from 'zod';
import { Request, Response } from 'express';
import storeRepository from '../repositories/storeRepository';
import productRepository from '../repositories/productRepository';
import roundConfigRepository from '../repositories/roundConfigRepository';
import prisma from '../utils/prisma';
import asyncHandler from '../utils/asyncHandler';
import { sendError } from '../utils/errorResponse';
import { parsePagination, paginate } from '../utils/pagination';
import type { Product } from '@prisma/client';

const createSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  initialCapital: z.number().positive('Capital inicial deve ser positivo'),
});

async function getMyStore(req: Request, res: Response): Promise<void> {
  const { squadId } = req.user!;
  if (!squadId) {
    sendError(res, 400, 'NO_SQUAD', 'Usuário não pertence a um squad');
    return;
  }

  const store = await storeRepository.findBySquadId(squadId);
  if (!store) {
    sendError(res, 404, 'STORE_NOT_FOUND', 'Loja não encontrada para este squad');
    return;
  }

  res.status(200).json(store);
}

async function createStore(req: Request, res: Response): Promise<void> {
  const { squadId } = req.user!;
  if (!squadId) {
    sendError(res, 400, 'NO_SQUAD', 'Usuário não pertence a um squad');
    return;
  }

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Dados inválidos', parsed.error.flatten().fieldErrors);
    return;
  }

  const existing = await storeRepository.findBySquadId(squadId);
  if (existing) {
    sendError(res, 409, 'STORE_ALREADY_EXISTS', 'Este squad já possui uma loja');
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
      data: products.map((p: Product) => ({
        storeId: store.id,
        productId: p.id,
        quantity: 0,
      })),
    });
  }

  res.status(201).json(store);
}

async function listStores(req: Request, res: Response): Promise<void> {
  const params = parsePagination(req);
  const [stores, totalElements] = await storeRepository.findPaginated(params.skip, params.size);
  res.status(200).json(paginate(stores, totalElements, params));
}

async function getPreviousCapex(req: Request, res: Response): Promise<void> {
  const { squadId } = req.user!;
  if (!squadId) {
    sendError(res, 400, 'NO_SQUAD', 'Usuário não pertence a um squad');
    return;
  }

  const store = await storeRepository.findBySquadId(squadId);
  if (!store) {
    sendError(res, 404, 'STORE_NOT_FOUND', 'Loja não encontrada para este squad');
    return;
  }

  const capexKeys = ['capexSeguranca', 'capexBalanca', 'capexRedes', 'capexSite', 'capexSelfCheckout', 'capexMelhoria'] as const;
  const configs = await roundConfigRepository.findCapexByStore(store.id);
  const usedCapex = capexKeys.filter((k) => configs.some((c: Record<string, boolean>) => c[k]));

  res.status(200).json(usedCapex);
}

export default {
  getMyStore: asyncHandler(getMyStore),
  createStore: asyncHandler(createStore),
  listStores: asyncHandler(listStores),
  getPreviousCapex: asyncHandler(getPreviousCapex),
};
