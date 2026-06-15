import { z } from 'zod';

export const createSquadSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
});

export const updateSquadSchema = z.object({
  name: z.string().min(1).optional(),
});

export const addUserToSquadSchema = z.object({
  userId: z.string().min(1, 'userId é obrigatório'),
});

export type CreateSquadInput = z.infer<typeof createSquadSchema>;
export type UpdateSquadInput = z.infer<typeof updateSquadSchema>;
