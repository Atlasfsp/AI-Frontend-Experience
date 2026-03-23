import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import {
  createRefreshResponse,
  refreshTokens,
  sessionCookieName,
} from '@bac/auth';

import { appendSessionCookie, readRequestSession } from '@/lib/auth';
import { loadAppEnv } from '@/lib/env';

export async function POST() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(sessionCookieName)?.value;
  const session = await readRequestSession(sessionToken);

  if (!session) {
    return NextResponse.json(
      { error: 'no_session', message: 'No valid session found' },
      { status: 401 },
    );
  }

  if (!session.refreshToken) {
    return NextResponse.json(
      { error: 'no_refresh_token', message: 'Session does not contain a refresh token' },
      { status: 401 },
    );
  }

  const env = loadAppEnv();

  try {
    const newTokens = await refreshTokens(session.refreshToken, {
      tokenUrl: env.authTokenUrl,
      clientId: env.authClientId,
      clientSecret: env.authClientSecret,
    });

    const updatedSession = createRefreshResponse(session, newTokens);
    const response = NextResponse.json({ ok: true, expiresAt: updatedSession.expiresAt });
    await appendSessionCookie(response, updatedSession);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token refresh failed';
    return NextResponse.json(
      { error: 'refresh_failed', message },
      { status: 401 },
    );
  }
}
