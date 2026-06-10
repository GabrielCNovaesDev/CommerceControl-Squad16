import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin routes - only GAME_MASTER
    if (path.startsWith('/admin') && token?.role !== 'GAME_MASTER') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Dashboard routes - only PLAYER
    if (path.startsWith('/dashboard') && token?.role === 'GAME_MASTER') {
      return NextResponse.redirect(new URL('/admin', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};