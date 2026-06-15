import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const path = request.nextUrl.pathname;

  // Admin routes - only GAME_MASTER
  if (path.startsWith('/admin') && token?.role !== 'GAME_MASTER') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Dashboard routes - only PLAYER (and OBSERVER)
  if (path.startsWith('/dashboard') && token?.role === 'GAME_MASTER') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Not authenticated - redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/dashboard', '/dashboard/:path*'],
};
