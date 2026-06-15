import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  purchasePrice: z.coerce.number().positive('Preço de compra deve ser positivo'),
  taxRate: z.coerce.number().min(0, 'taxRate mínimo é 0').max(1, 'taxRate máximo é 1').default(0),
  breakageRate: z.coerce.number().min(0, 'breakageRate mínimo é 0').max(1, 'breakageRate máximo é 1').default(0),
  agingRate: z.coerce.number().min(0, 'agingRate mínimo é 0').max(1, 'agingRate máximo é 1').default(0),
  mixAvailable: z.coerce.number().int('mixAvailable deve ser inteiro').min(0, 'mixAvailable não pode ser negativo').default(0),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  purchasePrice: z.coerce.number().positive().optional(),
  taxRate: z.coerce.number().min(0).max(1).optional(),
  breakageRate: z.coerce.number().min(0).max(1).optional(),
  agingRate: z.coerce.number().min(0).max(1).optional(),
  mixAvailable: z.coerce.number().int().min(0).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
