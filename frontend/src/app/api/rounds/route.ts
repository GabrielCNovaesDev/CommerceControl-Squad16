import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['GAME_MASTER', 'PLAYER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const rounds = await prisma.round.findMany({
      include: {
        _count: {
          select: { roundConfigs: true, financialResults: true },
        },
      },
      orderBy: { number: 'desc' },
    });

    return NextResponse.json({ data: rounds });
  } catch (error) {
    console.error('Erro ao listar rodadas:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'GAME_MASTER') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { number, durationHours, demandFactor } = body;

    if (!number) {
      return NextResponse.json({ error: 'Número da rodada é obrigatório' }, { status: 400 });
    }

    const duration = durationHours ? parseInt(durationHours) : 1;
    const endsAt = new Date(Date.now() + duration * 60 * 60 * 1000);

    const round = await prisma.round.create({
      data: {
        number: parseInt(number),
        durationHours: duration,
        endsAt,
        demandFactor: demandFactor ? parseFloat(demandFactor) : 0.5,
        status: 'OPEN',
      },
    });

    return NextResponse.json(round, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar rodada:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}