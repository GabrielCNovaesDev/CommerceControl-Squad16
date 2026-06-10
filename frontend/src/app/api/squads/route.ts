import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || session.user.role !== 'GAME_MASTER') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const squads = await prisma.squad.findMany({
      include: {
        _count: {
          select: { users: true, stores: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      data: squads.map((squad) => ({
        ...squad,
        userCount: squad._count.users,
        storeCount: squad._count.stores,
      })),
    });
  } catch (error) {
    console.error('Erro ao listar squads:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || session.user.role !== 'GAME_MASTER') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    const squad = await prisma.squad.create({
      data: { name },
    });

    return NextResponse.json(squad, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar squad:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}