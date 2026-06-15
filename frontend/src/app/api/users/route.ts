import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { ApiError, requireRole, withApiHandler } from '@/lib/apiAuth';
import { getPaginationParams, getSkip, createPaginatedResponse } from '@/lib/pagination';
import { createUserSchema, bulkCreateUsersSchema } from '@/lib/validators/users';
import prisma from '@/lib/prisma';

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  cargo: true,
  leader: true,
  squadId: true,
  createdAt: true,
} as const;

export const GET = withApiHandler(async (request: NextRequest) => {
  await requireRole(['GAME_MASTER']);
  const params = getPaginationParams(request);
  const skip = getSkip(params);

  const [users, total] = await Promise.all([
    prisma.user.findMany({ skip, take: params.limit, select: safeUserSelect, orderBy: { createdAt: 'desc' } }),
    prisma.user.count(),
  ]);
  return NextResponse.json(createPaginatedResponse(users, total, params.page!, params.limit!));
});

export const POST = withApiHandler(async (request: NextRequest) => {
  await requireRole(['GAME_MASTER']);
  const body = await request.json();

  // bulk: { squadId, count } — cria N jogadores automaticamente
  if (body && typeof body === 'object' && 'squadId' in body && 'count' in body) {
    const parsed = bulkCreateUsersSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Dados inválidos', parsed.error.flatten().fieldErrors);
    }
    const { squadId, count } = parsed.data;
    return NextResponse.json(await bulkCreate(squadId, count), { status: 201 });
  }

  // create: cria um usuário
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Dados inválidos', parsed.error.flatten().fieldErrors);
  }
  const { password, ...rest } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    throw new ApiError(409, 'EMAIL_IN_USE', 'Email já está em uso');
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { ...rest, password: hashed },
    select: safeUserSelect,
  });
  return NextResponse.json({ data: user }, { status: 201 });
});

function normalizeForEmail(str: string): string {
  return str
    .normalize('NFD')
    // strip diacritics (combining marks U+0300..U+036F)
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

async function bulkCreate(squadId: string, count: number) {
  const squad = await prisma.squad.findUnique({
    where: { id: squadId },
    include: { stores: { select: { name: true }, take: 1 } },
  });
  if (!squad) {
    throw new ApiError(404, 'SQUAD_NOT_FOUND', 'Squad não encontrado');
  }

  const domainBase = squad.stores.length > 0
    ? normalizeForEmail(squad.stores[0].name)
    : normalizeForEmail(squad.name);
  const domain = domainBase || 'squad';

  const existingEmails = await prisma.user.findMany({
    where: { email: { startsWith: 'jogador', contains: `@${domain}.com` } },
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
  const hashed = await bcrypt.hash(FIXED_PASSWORD, 10);

  const created: object[] = [];
  const errors: { index: number; email: string; reason: string }[] = [];

  for (let i = 0; i < count; i++) {
    const idx = startIndex + i;
    const name = `Jogador ${idx}`;
    const email = `jogador${idx}@${domain}.com`;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      errors.push({ index: idx, email, reason: 'Email já está em uso' });
      continue;
    }
    try {
      const u = await prisma.user.create({
        data: { name, email, password: hashed, role: 'PLAYER', squadId },
        select: safeUserSelect,
      });
      created.push(u);
    } catch {
      errors.push({ index: idx, email, reason: 'Erro ao criar usuário' });
    }
  }

  return { data: { created, errors, password: FIXED_PASSWORD } };
}
