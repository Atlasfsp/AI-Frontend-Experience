import { z } from 'zod';

import { type BacSession, roleHierarchy } from './session';

const JwtRoleSchema = z.enum(roleHierarchy);

export const BacJwtClaimsSchema = z.object({
  aud: z.union([z.string(), z.array(z.string())]).optional(),
  email: z.string().email().optional(),
  exp: z.number().int().optional(),
  iat: z.number().int().optional(),
  iss: z.string().optional(),
  name: z.string().optional(),
  preferred_username: z.string().optional(),
  roles: z.array(JwtRoleSchema).optional(),
  sub: z.string().min(1),
  tenant_id: z.string().optional(),
  workspace_id: z.string().optional(),
});

export type BacJwtClaims = z.infer<typeof BacJwtClaimsSchema>;

function decodeBase64Url(segment: string) {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(padded, 'base64').toString('utf8');
  }

  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function parseJwtClaims(token: string): BacJwtClaims {
  const parts = token.split('.');

  if (parts.length < 2) {
    throw new Error('Invalid JWT structure');
  }

  return BacJwtClaimsSchema.parse(JSON.parse(decodeBase64Url(parts[1]!)));
}

export function claimsToSession(
  claims: BacJwtClaims,
  overrides: Partial<BacSession> = {},
): BacSession {
  const expiresAt = claims.exp ? new Date(claims.exp * 1000).toISOString() : new Date(Date.now() + 3600e3).toISOString();

  return {
    accessToken: overrides.accessToken,
    authMode: 'oidc',
    email: claims.email ?? `${claims.sub}@example.com`,
    expiresAt,
    issuer: claims.iss,
    name: claims.name ?? claims.preferred_username ?? 'BAC Operator',
    refreshToken: overrides.refreshToken,
    roles: claims.roles?.length ? claims.roles : ['VIEWER'],
    scope: overrides.scope ?? ['openid', 'profile', 'email'],
    subject: claims.sub,
    tenantId: claims.tenant_id ?? 'tenant-echo',
    workspaceId: claims.workspace_id ?? 'workspace-core',
    ...overrides,
  };
}
