import type { NextRequest } from 'next/server';
import type { PaginatedResponse, PaginationParams } from '@/types/api';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Extrai e valida parâmetros de paginação da query string.
 * Defaults: page=1, limit=20. Máximo limit=100.
 */
export function getPaginationParams(req: NextRequest | URLSearchParams): PaginationParams {
  const sp =
    req instanceof URLSearchParams
      ? req
      : req.nextUrl?.searchParams ?? new URL(req.url).searchParams;

  const rawPage = parseInt(sp.get('page') ?? String(DEFAULT_PAGE), 10);
  const rawLimit = parseInt(sp.get('limit') ?? sp.get('size') ?? String(DEFAULT_LIMIT), 10);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : DEFAULT_PAGE;
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(MAX_LIMIT, rawLimit)
      : DEFAULT_LIMIT;

  return { page, limit };
}

export function getSkip(params: PaginationParams): number {
  return (params.page! - 1) * params.limit!;
}

/**
 * Monta o envelope de resposta paginada no formato esperado pelo frontend
 * (vide types/api.ts: PaginatedResponse<T>).
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  return {
    data,
    total,
    page,
    limit,
    totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
  };
}
