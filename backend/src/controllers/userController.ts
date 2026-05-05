import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Request, Response } from 'express';
import userRepository from '../repositories/userRepository';
import prisma from '../utils/prisma';
import asyncHandler from '../utils/asyncHandler';
import { sendError } from '../utils/errorResponse';
import { parsePagination, paginate } from '../utils/pagination';

// Normalizes a string to be used as an email domain segment
// e.g. "Mercado Alpha" → "mercadoalpha", "Loja São Paulo" → "lojasaopaulo"
function normalizeForEmail(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');     // keep only alphanumeric
}

const createSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  role: z.enum(['GAME_MASTER', 'PLAYER', 'OBSERVER']),
  cargo: z.string().optional().nullable(),
  squadId: z.string().min(1).optional().nullable(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['GAME_MASTER', 'PLAYER', 'OBSERVER']).optional(),
  leader: z.boolean().optional(),
  cargo: z.string().optional().nullable(),
  squadId: z.string().min(1).optional().nullable(),
});

async function listUsers(req: Request, res: Response): Promise<void> {
  const params = parsePagination(req);
  const [users, totalElements] = await userRepository.findPaginated(params.skip, params.size);
  res.status(200).json(paginate(users, totalElements, params));
}

async function createUser(req: Request, res: Response): Promise<void> {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Dados inválidos', parsed.error.flatten().fieldErrors);
    return;
  }

  const { name, email, password, role, cargo, squadId } = parsed.data;

  const existing = await userRepository.findByEmail(email);
  if (existing) {
    sendError(res, 409, 'EMAIL_IN_USE', 'Email já está em uso');
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await userRepository.create({ name, email, password: hashedPassword, role, cargo, squadId });

  res.status(201).json(user);
}

async function updateUser(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;

  const existing = await userRepository.findById(id);
  if (!existing) {
    sendError(res, 404, 'USER_NOT_FOUND', 'Usuário não encontrado');
    return;
  }

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Dados inválidos', parsed.error.flatten().fieldErrors);
    return;
  }

  const data = { ...parsed.data } as typeof parsed.data & { password?: string };
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  const user = await userRepository.update(id, data);
  res.status(200).json(user);
}

async function deleteUser(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;

  const existing = await userRepository.findById(id);
  if (!existing) {
    sendError(res, 404, 'USER_NOT_FOUND', 'Usuário não encontrado');
    return;
  }

  if (existing.leader) {
    sendError(res, 409, 'USER_IS_LEADER', 'Transfira a liderança antes de remover este usuário');
    return;
  }

  await userRepository.remove(id);
  res.status(200).json({ deleted: true });
}

const bulkCreateSchema = z.object({
  squadId: z.string().min(1, 'squadId é obrigatório'),
  count: z.number().int().min(1, 'Mínimo 1 jogador').max(50, 'Máximo 50 jogadores'),
});

async function bulkCreateUsers(req: Request, res: Response): Promise<void> {
  const parsed = bulkCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Dados inválidos', parsed.error.flatten().fieldErrors);
    return;
  }

  const { squadId, count } = parsed.data;

  // Fetch squad with its first store to build the email domain
  const squad = await prisma.squad.findUnique({
    where: { id: squadId },
    include: { stores: { select: { name: true }, take: 1 } },
  });

  if (!squad) {
    sendError(res, 404, 'SQUAD_NOT_FOUND', 'Squad não encontrado');
    return;
  }

  const domainBase = squad.stores.length > 0
    ? normalizeForEmail(squad.stores[0].name)
    : normalizeForEmail(squad.name);

  const domain = domainBase || 'squad';

  // Determine the next sequential index based on existing jogadorN@domain.com emails
  // This avoids collisions even if users were removed from the squad but their email remains
  const existingEmails = await prisma.user.findMany({
    where: { email: { startsWith: `jogador`, contains: `@${domain}.com` } },
    select: { email: true },
  });

  const existingIndices = existingEmails
    .map((u) => {
      const match = u.email.match(/^jogador(\d+)@/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);

  const startIndex = existingIndices.length > 0 ? Math.max(...existingIndices) + 1 : 1;

  const FIXED_PASSWORD = 'jogador123';
  const hashedPassword = await bcrypt.hash(FIXED_PASSWORD, 10);

  const created: object[] = [];
  const errors: { index: number; email: string; reason: string }[] = [];

  for (let i = 0; i < count; i++) {
    const idx = startIndex + i;
    const name = `Jogador ${idx}`;
    const email = `jogador${idx}@${domain}.com`;

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      errors.push({ index: idx, email, reason: 'Email já está em uso' });
      continue;
    }

    try {
      const user = await userRepository.create({
        name,
        email,
        password: hashedPassword,
        role: 'PLAYER',
        squadId,
      });
      created.push(user);
    } catch {
      errors.push({ index: idx, email, reason: 'Erro ao criar usuário' });
    }
  }

  res.status(201).json({ created, errors, password: FIXED_PASSWORD });
}

export default {
  listUsers: asyncHandler(listUsers),
  createUser: asyncHandler(createUser),
  updateUser: asyncHandler(updateUser),
  deleteUser: asyncHandler(deleteUser),
  bulkCreateUsers: asyncHandler(bulkCreateUsers),
};
