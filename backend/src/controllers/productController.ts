import { z } from 'zod';
import { Request, Response } from 'express';
import productRepository from '../repositories/productRepository';
import asyncHandler from '../utils/asyncHandler';
import { sendError } from '../utils/errorResponse';
import { parsePagination, paginate } from '../utils/pagination';

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
  const params = parsePagination(req);
  const [products, totalElements] = await productRepository.findPaginated(params.skip, params.size);
  res.status(200).json(paginate(products, totalElements, params));
}

async function createProduct(req: Request, res: Response): Promise<void> {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Dados inválidos', parsed.error.flatten().fieldErrors);
    return;
  }

  const product = await productRepository.create(parsed.data);
  res.status(201).json(product);
}

async function updateProduct(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);

  const existing = await productRepository.findById(id);
  if (!existing) {
    sendError(res, 404, 'PRODUCT_NOT_FOUND', 'Produto não encontrado');
    return;
  }

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Dados inválidos', parsed.error.flatten().fieldErrors);
    return;
  }

  const product = await productRepository.update(id, parsed.data);
  res.status(200).json(product);
}

async function deleteProduct(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);

  const existing = await productRepository.findById(id);
  if (!existing) {
    sendError(res, 404, 'PRODUCT_NOT_FOUND', 'Produto não encontrado');
    return;
  }

  const inUse = await productRepository.hasReferences(id);
  if (inUse) {
    sendError(res, 409, 'PRODUCT_IN_USE', 'Produto está em uso e não pode ser removido');
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
