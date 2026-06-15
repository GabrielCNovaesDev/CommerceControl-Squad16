import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

// POST /stores/[storeId]/inventory/restock
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'GAME_MASTER') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { storeId } = await params;
    const body = await request.json();
    const { productId, quantity } = body;

    if (!productId || quantity === undefined) {
      return NextResponse.json(
        { error: 'productId e quantity são obrigatórios' },
        { status: 400 }
      );
    }

    const inventory = await prisma.inventory.upsert({
      where: {
        storeId_productId: { storeId, productId },
      },
      create: {
        storeId,
        productId,
        quantity: parseInt(quantity),
      },
      update: {
        quantity: { increment: parseInt(quantity) },
      },
      include: {
        product: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Erro ao repor estoque:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}