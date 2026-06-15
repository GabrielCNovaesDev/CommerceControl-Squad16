import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string, userId: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'GAME_MASTER') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { userId } = await params;

    await prisma.user.update({
      where: { id: userId },
      data: { squadId: null },
    });

    return NextResponse.json({ message: 'Usuário removido do squad' });
  } catch (error) {
    console.error('Erro ao remover usuário do squad:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}