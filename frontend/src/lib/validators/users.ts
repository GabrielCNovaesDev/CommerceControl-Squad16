import { z } from 'zod';

const roleEnum = z.enum(['GAME_MASTER', 'PLAYER', 'OBSERVER']);

export const createUserSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  role: roleEnum,
  cargo: z.string().optional().nullable(),
  squadId: z.string().min(1).optional().nullable(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: roleEnum.optional(),
  leader: z.boolean().optional(),
  cargo: z.string().optional().nullable(),
  squadId: z.string().min(1).optional().nullable(),
});

export const bulkCreateUsersSchema = z.object({
  squadId: z.string().min(1, 'squadId é obrigatório'),
  count: z.coerce.number().int().min(1, 'Mínimo 1 jogador').max(50, 'Máximo 50 jogadores'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type BulkCreateUsersInput = z.infer<typeof bulkCreateUsersSchema>;
