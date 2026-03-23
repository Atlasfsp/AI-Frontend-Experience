/**
 * Re-exports unified permissions from @bac/domain-contracts for backward compatibility.
 *
 * The auth package maintains the session-aware `hasPermission(session, permission)` signature
 * that existing consumers depend on, delegating to the canonical role-based implementation.
 */

import {
  type BacPermission,
  type BacRole,
  getPermissionsForRoles,
  hasPermission as hasPermissionByRoles,
  ROLE_PERMISSIONS,
} from '@bac/domain-contracts';

import type { BacSession } from './session';

export type { BacPermission };
export { getPermissionsForRoles, ROLE_PERMISSIONS };

/** Session-aware permission check. Extracts roles from the session and delegates to the canonical matrix. */
export function hasPermission(
  session: Pick<BacSession, 'roles'> | null,
  permission: BacPermission,
): boolean {
  if (!session) {
    return false;
  }

  return hasPermissionByRoles(session.roles, permission);
}
