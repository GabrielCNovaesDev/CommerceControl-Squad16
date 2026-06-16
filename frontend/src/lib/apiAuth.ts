import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from './authOptions';

export type UserRole = 'GAME_MASTER' | 'PLAYER' | 'OBSERVER';

export interface AuthedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  squadId: string | null;
  squadName: string | null;
}

export interface AuthedSession {
  user: AuthedUser;
}

/**
 * Erro de aplicação que carrega o status HTTP, código semântico e mensagem.
 * O `withApiHandler` converte para o formato de resposta padrão:
 *   { error: { code, message, details? } }
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: unknown,
): NextResponse {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

function errorResponseFromApiError(err: ApiError): NextResponse {
  return errorResponse(err.status, err.code, err.message, err.details);
}

/**
 * Garante que há uma sessão ativa. Lança `ApiError(401)` caso contrário.
 * Para usar dentro de `withApiHandler`.
 */
export async function requireSession(): Promise<AuthedSession> {
  const session = (await getServerSession(authOptions)) as AuthedSession | null;
  if (!session?.user) {
    throw new ApiError(401, 'UNAUTHENTICATED', 'Sessão não encontrada');
  }
  return session;
}

/**
 * Garante que há sessão ativa E que o usuário tem uma das roles informadas.
 * Lança `ApiError(401)` ou `ApiError(403)` conforme o caso.
 */
export async function requireRole(roles: UserRole[]): Promise<AuthedSession> {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) {
    throw new ApiError(
      403,
      'FORBIDDEN',
      'Você não tem permissão para executar esta ação',
    );
  }
  return session;
}

/**
 * Wrapper que padroniza tratamento de erro em route handlers.
 *
 * Uso:
 *   export const GET = withApiHandler(async (req) => {
 *     const session = await requireRole(['GAME_MASTER']);
 *     ...
 *     return NextResponse.json({ data: result });
 *   });
 */
export function withApiHandler<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<NextResponse>,
): (...args: TArgs) => Promise<NextResponse> {
  return async (...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof ApiError) {
        return errorResponseFromApiError(err);
      }
      // Erros do Prisma
      if (typeof err === 'object' && err !== null && 'code' in err) {
        const prismaCode = (err as { code: string }).code;
        // Unique constraint violation
        if (prismaCode === 'P2002') {
          const target = (err as { meta?: { target?: string[] } }).meta?.target;
          if (Array.isArray(target) && target.includes('squadId')) {
            return errorResponse(409, 'STORE_ALREADY_EXISTS', 'Este squad já possui uma loja');
          }
          return errorResponse(409, 'CONFLICT', 'Registro duplicado');
        }
        if (prismaCode === 'P2025') {
          return errorResponse(404, 'NOT_FOUND', 'Registro não encontrado');
        }
      }
      console.error('[api]', err);
      return errorResponse(500, 'INTERNAL_ERROR', 'Erro interno do servidor');
    }
  };
}
