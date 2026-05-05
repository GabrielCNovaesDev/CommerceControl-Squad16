import { Response } from 'express';

export interface ErrorDetail {
  field?: string;
  message: string;
}

/**
 * Envia resposta de erro no formato padronizado:
 * { "error": { "code": "...", "message": "...", "details": [...] }, "traceId": "..." }
 */
export function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: ErrorDetail[] | Record<string, string[]>
): void {
  const traceId = (res.req as { traceId?: string }).traceId ?? 'unknown';
  res.status(status).json({
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
    traceId,
  });
}
