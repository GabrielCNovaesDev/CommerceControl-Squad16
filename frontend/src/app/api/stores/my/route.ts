import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

// GET /stores/my - Obter loja do jogador atual
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || session.user.role !== 'PLAYER') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const store = await prisma.store.findFirst({
      where: { squad: { users: { some: { id: session.user.id } } } },
      include: {
        squad: { select: { id: true, name: true } },
      },
    });

    if (!store) {
      return NextResponse.json({ error: 'Nenhuma loja encontrada' }, { status: 404 });
    }

    return NextResponse.json({ data: store });
  } catch (error) {
    console.error('Erro ao obter loja:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST /stores - Criar loja (apenas para jogadores)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || session.user.role !== 'PLAYER') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { name, initialCapital, squadId } = body;

    if (!name || !squadId) {
      return NextResponse.json({ error: 'Nome e squadId são obrigatórios' }, { status: 400 });
    }

    const store = await prisma.store.create({
      data: {
        name,
        initialCapital: initialCapital ? parseFloat(initialCapital) : 700000,
        currentCash: initialCapital ? parseFloat(initialCapital) : 700000,
        squadId,
      },
      include: {
        squad: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(store, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar loja:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}