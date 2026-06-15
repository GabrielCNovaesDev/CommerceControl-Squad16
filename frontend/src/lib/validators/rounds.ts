import { z } from 'zod';

export const createRoundSchema = z.object({
  number: z.coerce.number().int('Número deve ser um inteiro').positive('Número deve ser positivo'),
  durationHours: z.coerce.number().int('Duração deve ser um inteiro').positive('Duração deve ser positiva').default(1),
  demandFactor: z.coerce.number().min(0, 'Fator de demanda não pode ser negativo').max(1, 'Fator de demanda máximo é 1').default(0.5),
});

export const extendRoundSchema = z.object({
  additionalMinutes: z.coerce.number().int('Deve ser inteiro').positive('Deve ser positivo'),
});

export type CreateRoundInput = z.infer<typeof createRoundSchema>;
export type ExtendRoundInput = z.infer<typeof extendRoundSchema>;
