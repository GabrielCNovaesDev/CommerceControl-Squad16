import { z } from 'zod';
import { Request, Response } from 'express';
import productRepository from '../repositories/productRepository';
import asyncHandler from '../utils/asyncHandler';

const createSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  purchasePrice: z.number().positive('Preço de compra deve ser positivo'),
  taxRate: z.number().min(0).max(1, 'taxRate deve estar entre 0 e 1'),
  breakageRate: z.number().min(0).max(1, 'breakageRate deve estar entre 0 e 1'),
  agingRate: z.number().min(0).max(1, 'agingRate deve estar entre 0 e 1'),
  mixAvailable: z.number().int().min(0, 'mixAvailable não pode ser negativo'),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  purchasePrice: z.number().positive().optional(),
  taxRate: z.number().min(0).max(1).optional(),
  breakageRate: z.number().min(0).max(1).optional(),
  agingRate: z.number().min(0).max(1).optional(),
  mixAvailable: z.number().int().min(0).optional(),
});

async function listProducts(req: Request, res: Response): Promise<void> {
  const products = await productRepository.findAll();
  res.status(200).json(products);
}

async function createProduct(req: Request, res: Response): Promise<void> {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    return;
  }

  const product = await productRepository.create(parsed.data);
  res.status(201).json(product);
}

async function updateProduct(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const existing = await productRepository.findById(id);
  if (!existing) {
    res.status(404).json({ message: 'Produto não encontrado' });
    return;
  }

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    return;
  }

  const product = await productRepository.update(id, parsed.data);
  res.status(200).json(product);
}

async function deleteProduct(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const existing = await productRepository.findById(id);
  if (!existing) {
    res.status(404).json({ message: 'Produto não encontrado' });
    return;
  }

  const inUse = await productRepository.hasReferences(id);
  if (inUse) {
    res.status(409).json({ message: 'Produto está em uso e não pode ser removido' });
    return;
  }

  await productRepository.remove(id);
  res.status(200).json({ deleted: true });
}

export default {
  listProducts: asyncHandler(listProducts),
  createProduct: asyncHandler(createProduct),
  updateProduct: asyncHandler(updateProduct),
  deleteProduct: asyncHandler(deleteProduct),
};
