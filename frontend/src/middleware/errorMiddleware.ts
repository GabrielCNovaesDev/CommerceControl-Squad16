import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function errorMiddleware(
  request: NextRequest,
  handler: () => Promise<NextResponse>
) {
  return handler().catch((error) => {
    console.error('[API Error]', error);

    const statusCode = (error as { statusCode?: number }).statusCode || 500;
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';

    return NextResponse.json(
      { error: message },
      { status: statusCode }
    );
  });
}