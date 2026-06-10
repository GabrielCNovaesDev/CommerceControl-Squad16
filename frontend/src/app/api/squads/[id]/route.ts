import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();

    if (!session || session.user.role !== 'GAME_MASTER') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const squad = await prisma.squad.update({
      where: { id },
      data: { name: body.name },
    });

    return NextResponse.json(squad);
  } catch (error) {
    console.error('Erro ao atualizar squad:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();

    if (!session || session.user.role !== 'GAME_MASTER') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id } = await params;

    await prisma.squad.delete({ where: { id } });

    return NextResponse.json({ message: 'Squad deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar squad:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}