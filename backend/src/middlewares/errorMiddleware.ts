import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

interface PrismaError extends Error {
  code?: string;
}

function errorMiddleware(err: PrismaError, req: Request, res: Response, _next: NextFunction): void {
  const isProd = process.env.NODE_ENV === 'production';
  const traceId = (req as Request & { traceId?: string }).traceId ?? 'unknown';

  // Erro de validação Zod
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dados inválidos',
        details: err.flatten().fieldErrors,
      },
      traceId,
    });
    return;
  }

  // Erros do Prisma
  if (err.code) {
    if (err.code === 'P2025') {
      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Registro não encontrado' },
        traceId,
      });
      return;
    }

    if (err.code === 'P2002') {
      res.status(409).json({
        error: { code: 'CONFLICT', message: 'Registro já existe' },
        traceId,
      });
      return;
    }
  }

  // Erro genérico — loga sempre, não expõe stack em produção
  console.error(JSON.stringify({
    level: 'error',
    traceId,
    message: err.message,
    stack: isProd ? undefined : err.stack,
    timestamp: new Date().toISOString(),
  }));

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor',
      ...(isProd ? {} : { details: [{ message: err.message }] }),
    },
    traceId,
  });
}

export default errorMiddleware;
