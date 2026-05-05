import { Request } from 'express';

export interface PaginationParams {
  page: number;
  size: number;
  skip: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/**
 * Extrai e valida parâmetros de paginação da query string.
 * Defaults: page=0, size=20. Máximo size=100.
 */
export function parsePagination(req: Request): PaginationParams {
  const page = Math.max(0, parseInt(String(req.query.page ?? '0'), 10) || 0);
  const size = Math.min(100, Math.max(1, parseInt(String(req.query.size ?? '20'), 10) || 20));
  return { page, size, skip: page * size };
}

/**
 * Monta o envelope de resposta paginada no formato definido no AGENTS.md seção 12.
 */
export function paginate<T>(
  content: T[],
  totalElements: number,
  params: PaginationParams
): PaginatedResponse<T> {
  return {
    content,
    page: params.page,
    size: params.size,
    totalElements,
    totalPages: Math.ceil(totalElements / params.size),
  };
}
