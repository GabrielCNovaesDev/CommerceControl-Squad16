import { z } from 'zod';

export const updateSettingsSchema = z.object({
  defaultDemandFactor: z.coerce.number().min(0).max(1).optional(),
  defaultRoundDurationHours: z.coerce.number().int().positive().optional(),
  maxBulkUsers: z.coerce.number().int().positive().optional(),
  maxProductsPerRound: z.coerce.number().int().positive().optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
