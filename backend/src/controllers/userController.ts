import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Request, Response } from 'express';
import userRepository from '../repositories/userRepository';
import asyncHandler from '../utils/asyncHandler';

const createSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  role: z.enum(['GAME_MASTER', 'PLAYER', 'OBSERVER']),
  squadId: z.string().uuid().optional().nullable(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['GAME_MASTER', 'PLAYER', 'OBSERVER']).optional(),
  leader: z.boolean().optional(),
  squadId: z.string().uuid().optional().nullable(),
});

async function listUsers(req: Request, res: Response): Promise<void> {
  const users = await userRepository.findAll();
  res.status(200).json(users);
}

async function createUser(req: Request, res: Response): Promise<void> {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    return;
  }

  const { name, email, password, role, squadId } = parsed.data;

  const existing = await userRepository.findByEmail(email);
  if (existing) {
    res.status(409).json({ message: 'Email já está em uso' });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await userRepository.create({ name, email, password: hashedPassword, role, squadId });

  res.status(201).json(user);
}

async function updateUser(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;

  const existing = await userRepository.findById(id);
  if (!existing) {
    res.status(404).json({ message: 'Usuário não encontrado' });
    return;
  }

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
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
    res.status(404).json({ message: 'Usuário não encontrado' });
    return;
  }

  if (existing.leader) {
    res.status(409).json({
      message: 'Transfira a liderança antes de remover este usuário',
    });
    return;
  }

  await userRepository.remove(id);
  res.status(200).json({ deleted: true });
}

export default {
  listUsers: asyncHandler(listUsers),
  createUser: asyncHandler(createUser),
  updateUser: asyncHandler(updateUser),
  deleteUser: asyncHandler(deleteUser),
};
