import { z } from 'zod';

// Capital inicial predefinido (constante de produto, não configurável).
// Definido no model Store do Prisma como @default(700000).
export const DEFAULT_INITIAL_CAPITAL = 700000;

export const createStoreSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  squadId: z.string().min(1, 'squadId é obrigatório'),
  // initialCapital é ignorado mesmo se enviado — sempre usa DEFAULT_INITIAL_CAPITAL
});

export const restockInventorySchema = z.object({
  productId: z.string().min(1, 'productId é obrigatório'),
  quantity: z.coerce.number().int('Quantidade deve ser inteira').positive('Quantidade deve ser positiva'),
});

export const updateInventorySchema = z.object({
  quantity: z.coerce.number().int('Quantidade deve ser inteira').min(0, 'Quantidade não pode ser negativa'),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type RestockInventoryInput = z.infer<typeof restockInventorySchema>;
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;
