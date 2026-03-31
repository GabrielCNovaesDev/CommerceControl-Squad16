const { z } = require('zod');
const squadRepository = require('../repositories/squadRepository');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const createSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
});

const updateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
});

async function listSquads(req, res) {
  const squads = await squadRepository.findAll();
  return res.status(200).json(squads);
}

async function createSquad(req, res) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
  }

  const squad = await squadRepository.create(parsed.data);
  return res.status(201).json(squad);
}

async function updateSquad(req, res) {
  const { id } = req.params;

  const existing = await squadRepository.findById(id);
  if (!existing) {
    return res.status(404).json({ message: 'Squad não encontrado' });
  }

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
  }

  const squad = await squadRepository.update(id, parsed.data);
  return res.status(200).json(squad);
}

async function deleteSquad(req, res) {
  const { id } = req.params;

  const existing = await squadRepository.findById(id);
  if (!existing) {
    return res.status(404).json({ message: 'Squad não encontrado' });
  }

  const activeRound = await squadRepository.hasActiveRound(id);
  if (activeRound) {
    return res.status(409).json({ message: 'Squad possui rodada ativa e não pode ser removido' });
  }

  await squadRepository.remove(id);
  return res.status(200).json({ deleted: true });
}

async function addUserToSquad(req, res) {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'userId é obrigatório' });
  }

  const squad = await squadRepository.findById(id);
  if (!squad) {
    return res.status(404).json({ message: 'Squad não encontrado' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }

  const updated = await squadRepository.addUser(id, userId);
  return res.status(200).json(updated);
}

async function removeUserFromSquad(req, res) {
  const { id, userId } = req.params;

  const squad = await squadRepository.findById(id);
  if (!squad) {
    return res.status(404).json({ message: 'Squad não encontrado' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }

  if (user.squadId !== id) {
    return res.status(400).json({ message: 'Usuário não pertence a este squad' });
  }

  if (user.leader) {
    return res.status(409).json({ message: 'Transfira a liderança antes de remover este usuário do squad' });
  }

  const updated = await squadRepository.removeUser(userId);
  return res.status(200).json(updated);
}

module.exports = { listSquads, createSquad, updateSquad, deleteSquad, addUserToSquad, removeUserFromSquad };
