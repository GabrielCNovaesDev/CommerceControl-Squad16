import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiHandler } from '@/lib/apiAuth';
import { getPaginationParams, getSkip, createPaginatedResponse } from '@/lib/pagination';
import { createRoundSchema } from '@/lib/validators/rounds';
import prisma from '@/lib/prisma';

export const GET = withApiHandler(async (request: NextRequest) => {
  await requireRole(['GAME_MASTER', 'PLAYER']);
  const params = getPaginationParams(request);
  const skip = getSkip(params);

  const [rounds, total] = await Promise.all([
    prisma.round.findMany({
      skip,
      take: params.limit,
      include: {
        _count: {
          select: { roundConfigs: true, financialResults: true },
        },
      },
      orderBy: { number: 'desc' },
    }),
    prisma.round.count(),
  ]);

  // Inclui submittedConfigsCount no payload (mantido do contrato antigo)
  const data = rounds.map((r) => {
    const { _count, ...rest } = r;
    return { ...rest, submittedConfigsCount: _count?.roundConfigs ?? 0 };
  });

  return NextResponse.json(createPaginatedResponse(data, total, params.page!, params.limit!));
});

export const POST = withApiHandler(async (request: NextRequest) => {
  await requireRole(['GAME_MASTER']);
  const body = await request.json();
  const parsed = createRoundSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Dados inválidos', parsed.error.flatten().fieldErrors);
  }
  const { number, durationHours, demandFactor } = parsed.data;

  // Regra de negócio: não permite criar se já existe rodada OPEN
  const active = await prisma.round.findFirst({ where: { status: 'OPEN' } });
  if (active) {
    throw new ApiError(409, 'ROUND_ALREADY_OPEN', 'Encerre a rodada atual antes de criar uma nova');
  }

  const endsAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
  const round = await prisma.round.create({
    data: { number, durationHours, demandFactor, endsAt, status: 'OPEN' },
  });
  return NextResponse.json({ data: round }, { status: 201 });
});
