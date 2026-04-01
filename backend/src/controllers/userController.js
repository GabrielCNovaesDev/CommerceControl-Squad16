const bcrypt = require('bcryptjs');
const { z } = require('zod');
const userRepository = require('../repositories/userRepository');
const asyncHandler = require('../utils/asyncHandler');

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

async function listUsers(req, res) {
  const users = await userRepository.findAll();
  return res.status(200).json(users);
}

async function createUser(req, res) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
  }

  const { name, email, password, role, squadId } = parsed.data;

  const existing = await userRepository.findByEmail(email);
  if (existing) {
    return res.status(409).json({ message: 'Email já está em uso' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await userRepository.create({ name, email, password: hashedPassword, role, squadId });

  return res.status(201).json(user);
}

async function updateUser(req, res) {
  const { id } = req.params;

  const existing = await userRepository.findById(id);
  if (!existing) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
  }

  const data = { ...parsed.data };
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  const user = await userRepository.update(id, data);
  return res.status(200).json(user);
}

async function deleteUser(req, res) {
  const { id } = req.params;

  // findById não retorna password, mas leader sim
  const existing = await userRepository.findById(id);
  if (!existing) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }

  if (existing.leader) {
    return res.status(409).json({
      message: 'Transfira a liderança antes de remover este usuário',
    });
  }

  await userRepository.remove(id);
  return res.status(200).json({ deleted: true });
}

module.exports = {
  listUsers: asyncHandler(listUsers),
  createUser: asyncHandler(createUser),
  updateUser: asyncHandler(updateUser),
  deleteUser: asyncHandler(deleteUser),
};
