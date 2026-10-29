import { describe, expect, it } from 'vitest';

import { buildAuthorizationUrl } from './oidc';

describe('OIDC authorization requests', () => {
  it('requests FluxCore identity claims and PKCE by default', async () => {
    const result = await buildAuthorizationUrl({
      authorizationUrl: 'http://authentik.local/application/o/authorize/',
      clientId: 'fluxcore-local',
      redirectUri: 'http://localhost:3000/api/auth/callback',
    });
    const url = new URL(result.url);

    expect(url.searchParams.get('scope')?.split(' ')).toEqual([
      'openid', 'profile', 'email', 'offline_access', 'fluxcore',
    ]);
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('code_challenge')).toBeTruthy();
    expect(result.codeVerifier).toBeTruthy();
  });
});
