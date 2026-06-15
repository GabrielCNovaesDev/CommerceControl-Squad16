import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

// GET /stores/[storeId]/inventory
export async function GET(request: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['GAME_MASTER', 'PLAYER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { storeId } = await params;

    const inventories = await prisma.inventory.findMany({
      where: { storeId },
      include: {
        product: { select: { id: true, name: true, purchasePrice: true } },
      },
    });

    return NextResponse.json({ data: inventories });
  } catch (error) {
    console.error('Erro ao obter inventário:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}