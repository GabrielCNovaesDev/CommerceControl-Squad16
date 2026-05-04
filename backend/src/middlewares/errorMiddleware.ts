import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

interface PrismaError extends Error {
  code?: string;
}

function errorMiddleware(err: PrismaError, req: Request, res: Response, _next: NextFunction): void {
  const isProd = process.env.NODE_ENV === 'production';

  // Erro de validação Zod
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Dados inválidos',
      details: err.flatten().fieldErrors,
    });
    return;
  }

  // Erros do Prisma
  if (err.code) {
    // Registro não encontrado
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Registro não encontrado' });
      return;
    }

    // Violação de unique constraint
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Registro já existe' });
      return;
    }
  }

  // Erro genérico — loga sempre, expõe detalhes apenas fora de produção
  console.error('[errorMiddleware]', err);

  res.status(500).json({
    error: 'Erro interno do servidor',
    ...(isProd ? {} : { message: err.message, stack: err.stack }),
  });
}

export default errorMiddleware;
