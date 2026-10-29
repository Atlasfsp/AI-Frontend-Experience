import { describe, expect, it } from 'vitest';

import { claimsToSession, parseJwtClaims } from './claims';

describe('Authentik session claim mapping', () => {
  it.skipIf(!process.env.FLUXCORE_AUTHENTIK_LOCAL_ID_TOKEN)(
    'keeps the tenant, workspace, and application role from a live local token',
    () => {
      const token = process.env.FLUXCORE_AUTHENTIK_LOCAL_ID_TOKEN!;
      const session = claimsToSession(parseJwtClaims(token));
      expect(session.tenantId).toBe('tenant-fluxcore-m7');
      expect(session.workspaceId).toBe('workspace-fluxcore-m7');
      expect(session.roles).toEqual(['MEMBER']);
    },
  );
});
