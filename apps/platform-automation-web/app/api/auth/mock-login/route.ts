import { NextResponse } from 'next/server';

import { createMockSession } from '@bac/auth';

import { appendSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  const formData = await request.formData();
  const nextPath = formData.get('next')?.toString() ?? '/platform';

  const response = NextResponse.redirect(new URL(nextPath, request.url));
  await appendSessionCookie(response, createMockSession({ roles: ['PLATFORM_ADMIN'] }));

  return response;
}
