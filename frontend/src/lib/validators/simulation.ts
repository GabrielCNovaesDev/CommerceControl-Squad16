import { z } from 'zod';

const capexFlags = {
  capexSeguranca: z.coerce.boolean().optional(),
  capexBalanca: z.coerce.boolean().optional(),
  capexRedes: z.coerce.boolean().optional(),
  capexSite: z.coerce.boolean().optional(),
  capexSelfCheckout: z.coerce.boolean().optional(),
  capexMelhoria: z.coerce.boolean().optional(),
};

const baseSchema = z.object({
  otherExpenses: z.coerce.number().min(0, 'Despesas não podem ser negativas').default(0),
  cashierOperators: z.coerce.number().int().min(0).default(10),
  serviceOperators: z.coerce.number().int().min(0).default(5),
  numPdvs: z.coerce.number().int().min(0).default(6),
  quizScore: z.coerce.number().min(0).max(1).default(1.0),
  ...capexFlags,
});

export const submitConfigSchema = baseSchema.extend({
  products: z.array(
    z.object({
      productId: z.string().min(1),
      margin: z.coerce.number().min(0).max(1, 'Margem máxima é 1'),
      salesVolume: z.coerce.number().int().min(0),
    }),
  ).default([]),
});

// Preview precisa do purchasePrice para cálculo de receita estimada
export const previewConfigSchema = baseSchema.extend({
  products: z.array(
    z.object({
      productId: z.string().min(1),
      purchasePrice: z.coerce.number().min(0),
      margin: z.coerce.number().min(0).max(1),
      salesVolume: z.coerce.number().int().min(0),
    }),
  ).default([]),
});

export type SubmitConfigInput = z.infer<typeof submitConfigSchema>;
export type PreviewConfigInput = z.infer<typeof previewConfigSchema>;
