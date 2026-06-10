import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function traceMiddleware(request: NextRequest) {
  const traceId = crypto.randomUUID();
  const startTime = Date.now();

  const response = NextResponse.next();
  response.headers.set('x-trace-id', traceId);
  response.headers.set('x-request-time', startTime.toString());

  return response;
}