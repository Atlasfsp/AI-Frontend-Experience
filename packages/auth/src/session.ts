import { z } from 'zod';

import {
  type BacRole,
  BacSessionBaseSchema,
  isSessionExpired,
  roleHierarchy,
} from '@bac/domain-contracts';

export { isSessionExpired, roleHierarchy };
export type { BacRole };

export const sessionCookieName = 'bac_session';

/**
 * Web-specific session schema extending the shared base with auth tokens.
 */
export const BacSessionSchema = BacSessionBaseSchema.extend({
  accessToken: z.string().min(1).optional(),
  authMode: z.enum(['mock', 'oidc']),
  idToken: z.string().optional(),
  issuer: z.string().optional(),
  refreshExpiresAt: z.string().optional(),
  refreshToken: z.string().optional(),
  scope: z.array(z.string()).optional(),
});

export type BacSession = z.infer<typeof BacSessionSchema>;

function encodeBase64Url(value: string) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'utf8').toString('base64url');
  }

  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'base64url').toString('utf8');
  }

  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function createMockSession(overrides: Partial<BacSession> = {}): BacSession {
  return {
    accessToken: undefined,
    subject: 'user_01',
    email: 'operator@stratogroup.dev',
    name: 'BAC Operator',
    issuer: 'mock://bac',
    tenantId: 'tenant-echo',
    workspaceId: 'workspace-core',
    roles: ['ADMIN'],
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
    authMode: 'mock',
    ...overrides,
  };
}

export function serializeSession(session: BacSession): string {
  return encodeBase64Url(JSON.stringify(BacSessionSchema.parse(session)));
}

export function parseSessionCookie(value: string | undefined): BacSession | null {
  if (!value) {
    return null;
  }

  try {
    const decoded = decodeBase64Url(value);
    return BacSessionSchema.parse(JSON.parse(decoded));
  } catch {
    return null;
  }
}

export function hasRole(session: BacSession | null, requiredRoles: BacRole[]): boolean {
  if (!session) {
    return false;
  }

  const highestRoleIndex = Math.max(...session.roles.map((role) => roleHierarchy.indexOf(role)));
  return requiredRoles.some((role) => highestRoleIndex >= roleHierarchy.indexOf(role));
}
