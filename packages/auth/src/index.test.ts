import { describe, expect, it } from 'vitest';

import {
  createMockSession,
  createSignedSessionToken,
  getPermissionsForRoles,
  hasPermission,
  hasRole,
  parseSessionCookie,
  serializeSession,
  verifySignedSessionToken,
} from './index';

describe('auth session helpers', () => {
  it('serializes and parses sessions', () => {
    const session = createMockSession();
    const parsed = parseSessionCookie(serializeSession(session));
    expect(parsed?.tenantId).toBe(session.tenantId);
  });

  it('applies role hierarchy', () => {
    const session = createMockSession({ roles: ['ADMIN'] });
    expect(hasRole(session, ['MEMBER'])).toBe(true);
    expect(hasRole(session, ['PLATFORM_ADMIN'])).toBe(false);
  });

  it('derives permissions from roles', () => {
    const permissions = getPermissionsForRoles(['PLATFORM_ADMIN']);
    expect(permissions).toContain('audit_log:view');
    expect(hasPermission(createMockSession({ roles: ['VIEWER'] }), 'workspace:manage')).toBe(false);
  });

  it('signs and verifies session tokens', async () => {
    const session = createMockSession();
    const token = await createSignedSessionToken(session, 'test-secret');
    const parsed = await verifySignedSessionToken(token, 'test-secret');
    expect(parsed?.subject).toBe(session.subject);
  });
});
