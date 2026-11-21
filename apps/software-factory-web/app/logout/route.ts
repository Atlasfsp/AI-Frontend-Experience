import { NextResponse, type NextRequest } from 'next/server';

import { clearAuthCookies, sameOriginRedirect } from '@/lib/auth';

// Sign-out is POST-only: the router prefetches GET links in production, and a
// state-changing GET would clear the session of every signed-in visitor.
export async function POST(request: NextRequest) {
  if (request.headers.get('sec-fetch-site') === 'cross-site') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const response = sameOriginRedirect('/login');
  clearAuthCookies(response);
  return response;
}
