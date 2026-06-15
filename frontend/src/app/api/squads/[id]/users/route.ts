import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'GAME_MASTER') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id: squadId } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { squadId },
    });

    return NextResponse.json({ message: 'Usuário adicionado ao squad' });
  } catch (error) {
    console.error('Erro ao adicionar usuário ao squad:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}