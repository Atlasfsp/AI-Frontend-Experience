import { NextResponse } from 'next/server';

import { clearAuthCookies } from '@/lib/auth';

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL('/login', request.url));
  clearAuthCookies(response);
  return response;
}
