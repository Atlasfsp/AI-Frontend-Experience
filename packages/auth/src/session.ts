import { z } from 'zod';

export const sessionCookieName = 'bac_session';

export const roleHierarchy = ['VIEWER', 'MEMBER', 'ADMIN', 'PLATFORM_ADMIN', 'OPERATOR'] as const;
export type BacRole = (typeof roleHierarchy)[number];

export const BacSessionSchema = z.object({
  accessToken: z.string().min(1).optional(),
  subject: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  tenantId: z.string().min(1),
  workspaceId: z.string().min(1),
  roles: z.array(z.enum(roleHierarchy)).min(1),
  expiresAt: z.string().min(1),
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

export function isSessionExpired(session: Pick<BacSession, 'expiresAt'> | null) {
  if (!session) {
    return true;
  }

  return new Date(session.expiresAt).getTime() <= Date.now();
}
