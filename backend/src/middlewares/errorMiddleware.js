const { ZodError } = require('zod');

function errorMiddleware(err, req, res, next) {
  const isProd = process.env.NODE_ENV === 'production';

  // Erro de validação Zod
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: err.flatten().fieldErrors,
    });
  }

  // Erros do Prisma
  if (err.code) {
    // Registro não encontrado
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    // Violação de unique constraint
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Registro já existe' });
    }
  }

  // Erro genérico — loga sempre, expõe detalhes apenas fora de produção
  console.error('[errorMiddleware]', err);

  return res.status(500).json({
    error: 'Erro interno do servidor',
    ...(isProd ? {} : { message: err.message, stack: err.stack }),
  });
}

module.exports = errorMiddleware;
