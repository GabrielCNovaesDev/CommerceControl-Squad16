import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import asyncHandler from '../utils/asyncHandler';
import { sendError } from '../utils/errorResponse';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Dados inválidos', parsed.error.flatten().fieldErrors);
    return;
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Mensagem genérica — não vaza se o email existe ou não (seção 5.1)
    sendError(res, 401, 'INVALID_CREDENTIALS', 'Email ou senha inválidos');
    return;
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    sendError(res, 401, 'INVALID_CREDENTIALS', 'Email ou senha inválidos');
    return;
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role, squadId: user.squadId },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );

  res.status(200).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      squadId: user.squadId,
    },
  });
}

export default { login: asyncHandler(login) };
