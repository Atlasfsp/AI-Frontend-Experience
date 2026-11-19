import { NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockedAppEnv = vi.hoisted(() => ({
  environment: 'staging',
  sessionSecret: 'test-session-secret-with-more-than-32-characters',
}));

vi.mock('./env', () => ({
  loadAppEnv: () => mockedAppEnv,
}));

import { sessionCookieName } from '@bac/auth';

import { appendSessionCookie } from './auth';

describe('session cookie transport policy', () => {
  beforeEach(() => {
    mockedAppEnv.environment = 'staging';
  });

  it.each(['staging', 'production'])(
    'marks the session cookie Secure in %s',
    async (environment) => {
      mockedAppEnv.environment = environment;
      const response = new NextResponse();

      await appendSessionCookie(response);

      expect(response.cookies.get(sessionCookieName)?.secure).toBe(true);
    },
  );

  it('keeps local development cookies usable over HTTP', async () => {
    mockedAppEnv.environment = 'development';
    const response = new NextResponse();

    await appendSessionCookie(response);

    expect(response.cookies.get(sessionCookieName)?.secure).toBe(false);
  });
});
