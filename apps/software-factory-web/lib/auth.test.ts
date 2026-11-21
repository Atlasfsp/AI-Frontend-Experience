import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockedAppEnv = vi.hoisted(() => ({
  environment: 'staging',
  sessionSecret: 'test-session-secret-with-more-than-32-characters',
}));

vi.mock('./env', () => ({
  loadAppEnv: () => mockedAppEnv,
}));

import { sessionCookieName } from '@bac/auth';

import { appendSessionCookie, createOidcCallbackResponse, safeNextPath, sameOriginRedirect } from './auth';

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

  it('accepts only same-origin absolute paths as post-login destinations', () => {
    expect(safeNextPath('/software-factory/workspaces/p-1?tab=tasks')).toBe('/software-factory/workspaces/p-1?tab=tasks');
    for (const unsafe of ['//evil.example', 'https://evil.example', '/\\evil.example', 'relative', '', undefined, null]) {
      expect(safeNextPath(unsafe)).toBe('/software-factory');
    }
    const redirect = sameOriginRedirect('//evil.example');
    expect(redirect.status).toBe(303);
    expect(redirect.headers.get('location')).toBe('/software-factory');
  });

  it('refuses an off-site OIDC return path stored in the next cookie', async () => {
    const request = new NextRequest('http://internal:3000/api/auth/callback');
    request.cookies.set('bac_auth_next', '//evil.example/steal');
    const response = await createOidcCallbackResponse(request);
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/login?error=oidc_state&next=%2Fsoftware-factory');
  });

  it('keeps local development cookies usable over HTTP', async () => {
    mockedAppEnv.environment = 'development';
    const response = new NextResponse();

    await appendSessionCookie(response);

    expect(response.cookies.get(sessionCookieName)?.secure).toBe(false);
  });
});
