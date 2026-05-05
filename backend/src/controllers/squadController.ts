import { z } from 'zod';
import { Request, Response } from 'express';
import squadRepository from '../repositories/squadRepository';
import prisma from '../utils/prisma';
import asyncHandler from '../utils/asyncHandler';

const createSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
});

const updateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
});

async function listSquads(req: Request, res: Response): Promise<void> {
  const squads = await squadRepository.findAll();
  res.status(200).json(squads);
}

async function createSquad(req: Request, res: Response): Promise<void> {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    return;
  }

  const squad = await squadRepository.create(parsed.data);
  res.status(201).json(squad);
}

async function updateSquad(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);

  const existing = await squadRepository.findById(id);
  if (!existing) {
    res.status(404).json({ message: 'Squad não encontrado' });
    return;
  }

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    return;
  }

  const squad = await squadRepository.update(id, parsed.data);
  res.status(200).json(squad);
}

async function deleteSquad(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);

  const existing = await squadRepository.findById(id);
  if (!existing) {
    res.status(404).json({ message: 'Squad não encontrado' });
    return;
  }

  const activeRound = await squadRepository.hasActiveRound(id);
  if (activeRound) {
    res.status(409).json({ message: 'Squad possui rodada ativa e não pode ser removido' });
    return;
  }

  await squadRepository.remove(id);
  res.status(200).json({ deleted: true });
}

async function addUserToSquad(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const { userId } = req.body as { userId?: string };

  if (!userId) {
    res.status(400).json({ message: 'userId é obrigatório' });
    return;
  }

  const squad = await squadRepository.findById(id);
  if (!squad) {
    res.status(404).json({ message: 'Squad não encontrado' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ message: 'Usuário não encontrado' });
    return;
  }

  const updated = await squadRepository.addUser(id, userId);
  res.status(200).json(updated);
}

async function removeUserFromSquad(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const userId = String(req.params.userId);

  const squad = await squadRepository.findById(id);
  if (!squad) {
    res.status(404).json({ message: 'Squad não encontrado' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ message: 'Usuário não encontrado' });
    return;
  }

  if (user.squadId !== id) {
    res.status(400).json({ message: 'Usuário não pertence a este squad' });
    return;
  }

  if (user.leader) {
    res.status(409).json({ message: 'Transfira a liderança antes de remover este usuário do squad' });
    return;
  }

  const updated = await squadRepository.removeUser(userId);
  res.status(200).json(updated);
}

export default {
  listSquads: asyncHandler(listSquads),
  createSquad: asyncHandler(createSquad),
  updateSquad: asyncHandler(updateSquad),
  deleteSquad: asyncHandler(deleteSquad),
  addUserToSquad: asyncHandler(addUserToSquad),
  removeUserFromSquad: asyncHandler(removeUserFromSquad),
};
