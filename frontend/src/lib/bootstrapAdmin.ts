import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function ensureAdminExists() {
  try {
    const count = await prisma.user.count({
      where: { role: 'GAME_MASTER' },
    });

    if (count === 0) {
      const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
      const password = await bcrypt.hash(defaultPassword, 10);

      await prisma.user.create({
        data: {
          name: 'Admin',
          email: 'admin@simulador.com',
          password,
          role: 'GAME_MASTER',
          leader: false,
        },
      });

      console.log('✓ Conta admin padrão criada: admin@simulador.com');
    }
  } catch (err) {
    console.error('Aviso: não foi possível verificar/criar admin padrão:', err);
  }
}

// Chamar automaticamente quando o servidor iniciar
ensureAdminExists();