import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Injeta um traceId único em cada requisição.
 * - Disponível em req.traceId para uso nos helpers de erro e logs.
 * - Propagado no header X-Trace-Id da resposta para rastreabilidade no cliente.
 */
function traceMiddleware(req: Request, res: Response, next: NextFunction): void {
  const traceId = (req.headers['x-trace-id'] as string) || randomUUID();
  (req as Request & { traceId: string }).traceId = traceId;
  res.setHeader('X-Trace-Id', traceId);
  next();
}

export default traceMiddleware;
