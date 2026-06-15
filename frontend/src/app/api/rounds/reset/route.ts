import { NextRequest, NextResponse } from 'next/server';
import { requireRole, withApiHandler } from '@/lib/apiAuth';
import prisma from '@/lib/prisma';

// POST /rounds/reset
export const POST = withApiHandler(async (_request: NextRequest) => {
  await requireRole(['GAME_MASTER']);

  // Ordem importa por causa das FKs. Tudo em uma transação para garantir consistência.
  await prisma.$transaction([
    prisma.financialResult.deleteMany(),
    prisma.roundConfigItem.deleteMany(),
    prisma.roundConfig.deleteMany(),
    prisma.roundEvent.deleteMany(),
    prisma.round.deleteMany(),
  ]);

  // Resetar capital das lojas para o valor inicial
  const stores = await prisma.store.findMany({ select: { id: true, initialCapital: true } });
  for (const store of stores) {
    await prisma.store.update({
      where: { id: store.id },
      data: { currentCash: store.initialCapital },
    });
  }

  return NextResponse.json({ message: 'Jogo resetado com sucesso. Todas as rodadas foram excluídas.' });
});
