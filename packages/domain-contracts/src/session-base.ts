import { z } from 'zod';

import { BAC_ROLES, type BacRole } from './roles';

/**
 * Common session fields shared by web and mobile platforms.
 *
 * Platform-specific session types extend this base with their own fields
 * (e.g. accessToken, idToken, biometricRequired).
 */
export const BacSessionBaseSchema = z.object({
  subject: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  tenantId: z.string().min(1),
  workspaceId: z.string().min(1),
  roles: z.array(z.enum(BAC_ROLES)).min(1),
  expiresAt: z.string().min(1),
});

export type BacSessionBase = z.infer<typeof BacSessionBaseSchema>;

/** Returns true if the session has expired based on `expiresAt`. */
export function isSessionExpired(session: Pick<BacSessionBase, 'expiresAt'> | null | undefined): boolean {
  if (!session) {
    return true;
  }

  return new Date(session.expiresAt).getTime() <= Date.now();
}
