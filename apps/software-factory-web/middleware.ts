import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { sessionCookieName } from '@bac/auth';

import { readRequestSession } from '@/lib/auth';
import { canAccessPath } from '@/lib/spicedb';

const publicPrefixes = ['/login', '/api', '/_next', '/favicon.ico'];

export async function middleware(request: NextRequest) {
  if (publicPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const session = await readRequestSession(request.cookies.get(sessionCookieName)?.value);

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!canAccessPath(session, request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/software-factory/dashboard?error=forbidden', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.png$).*)'],
};
