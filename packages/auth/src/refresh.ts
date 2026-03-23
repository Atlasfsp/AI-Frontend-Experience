import { z } from 'zod';

import { claimsToSession, parseJwtClaims } from './claims';
import type { BacSession } from './session';

const TokenResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive().optional(),
  id_token: z.string().optional(),
  refresh_token: z.string().optional(),
  refresh_expires_in: z.number().int().positive().optional(),
  scope: z.string().optional(),
  token_type: z.string().optional(),
});

export type TokenResponse = z.infer<typeof TokenResponseSchema>;

export interface OidcRefreshConfig {
  tokenUrl: string;
  clientId: string;
  clientSecret?: string;
}

/**
 * Exchange a refresh token for a new token set via the Authentik token endpoint.
 */
export async function refreshTokens(
  refreshToken: string,
  config: OidcRefreshConfig,
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: config.clientId,
  });

  if (config.clientSecret) {
    body.set('client_secret', config.clientSecret);
  }

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'unknown');
    throw new Error(
      `Token refresh failed with status ${response.status}: ${errorBody}`,
    );
  }

  return TokenResponseSchema.parse(await response.json());
}

/**
 * Build an updated BacSession from a previous session and new token response.
 */
export function createRefreshResponse(
  session: BacSession,
  newTokens: TokenResponse,
): BacSession {
  const claims = parseJwtClaims(
    newTokens.id_token ?? newTokens.access_token,
  );

  const expiresAt = newTokens.expires_in
    ? new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
    : claims.exp
      ? new Date(claims.exp * 1000).toISOString()
      : new Date(Date.now() + 3600e3).toISOString();

  const refreshExpiresAt = newTokens.refresh_expires_in
    ? new Date(Date.now() + newTokens.refresh_expires_in * 1000).toISOString()
    : undefined;

  return claimsToSession(claims, {
    accessToken: newTokens.access_token,
    authMode: session.authMode,
    expiresAt,
    idToken: newTokens.id_token,
    refreshExpiresAt,
    refreshToken: newTokens.refresh_token ?? session.refreshToken,
    scope: newTokens.scope?.split(' ') ?? session.scope,
    tenantId: session.tenantId,
    workspaceId: session.workspaceId,
  });
}
