import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { JWT } from 'next-auth/jwt';
import { UserRole } from '@/types/api';

export function roleMiddleware(allowedRoles: UserRole[]) {
  return async (token: JWT | null) => {
    if (!token) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const userRole = token.role as UserRole;
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Acesso negado. Permissão insuficiente.' },
        { status: 403 }
      );
    }

    return token;
  };
}