import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || !['GAME_MASTER', 'PLAYER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: products });
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
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
    const { name, purchasePrice, taxRate, breakageRate, agingRate, mixAvailable } = body;

    if (!name || purchasePrice === undefined) {
      return NextResponse.json(
        { error: 'Nome e preço de compra são obrigatórios' },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        purchasePrice: parseFloat(purchasePrice),
        taxRate: taxRate ? parseFloat(taxRate) : 0,
        breakageRate: breakageRate ? parseFloat(breakageRate) : 0,
        agingRate: agingRate ? parseFloat(agingRate) : 0,
        mixAvailable: mixAvailable ? parseInt(mixAvailable) : 0,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}