import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

// PATCH /rounds/[id]/extend
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();

    if (!session || session.user.role !== 'GAME_MASTER') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { hours } = body;

    const round = await prisma.round.findUnique({ where: { id } });
    if (!round) {
      return NextResponse.json({ error: 'Rodada não encontrada' }, { status: 404 });
    }

    const extendBy = hours ? parseInt(hours) : 1;
    const newEndsAt = new Date(round.endsAt.getTime() + extendBy * 60 * 60 * 1000);

    const updated = await prisma.round.update({
      where: { id },
      data: { endsAt: newEndsAt },
    });

    return NextResponse.json({ data: updated, message: `Rodada extendida por ${extendBy} hora(s)` });
  } catch (error) {
    console.error('Erro ao extender rodada:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}