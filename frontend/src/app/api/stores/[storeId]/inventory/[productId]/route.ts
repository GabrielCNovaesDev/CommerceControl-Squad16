import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

// PUT /stores/[storeId]/inventory/[productId]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string, productId: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session || session.user.role !== 'GAME_MASTER') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { storeId, productId } = await params;
    const body = await request.json();
    const { quantity } = body;

    const inventory = await prisma.inventory.upsert({
      where: {
        storeId_productId: { storeId, productId },
      },
      create: {
        storeId,
        productId,
        quantity: quantity !== undefined ? parseInt(quantity) : 0,
      },
      update: {
        quantity: quantity !== undefined ? parseInt(quantity) : undefined,
      },
      include: {
        product: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Erro ao atualizar inventário:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}