import type { BacRole } from './roles';

export const BAC_PERMISSIONS = [
  'application:deploy',
  'application:rollback',
  'application:view',
  'approval:action',
  'approval:view',
  'audit_log:view',
  'compliance:manage',
  'compliance:view',
  'data_access:manage',
  'data_access:mutate',
  'data_access:query',
  'data_access:subscribe',
  'data_access:view',
  'database_cluster:manage',
  'database_cluster:view',
  'incident:manage',
  'incident:view',
  'promise:claim',
  'promise:manage',
  'promise:view',
  'secret:read',
  'workspace:deploy',
  'workspace:manage',
  'workspace:view',
] as const;

export type BacPermission = (typeof BAC_PERMISSIONS)[number];

/**
 * Canonical role-to-permission matrix covering all 9 BAC roles.
 *
 * Web roles carry the original permission sets.
 * Mobile persona roles are scoped to their operational domain.
 */
export const ROLE_PERMISSIONS: Readonly<Record<BacRole, readonly BacPermission[]>> = {
  VIEWER: [
    'application:view',
    'data_access:view',
    'promise:view',
    'workspace:view',
  ],
  MEMBER: [
    'application:view',
    'data_access:query',
    'data_access:subscribe',
    'data_access:view',
    'promise:view',
    'workspace:view',
  ],
  ADMIN: [
    'application:deploy',
    'application:view',
    'data_access:manage',
    'data_access:mutate',
    'data_access:query',
    'data_access:subscribe',
    'data_access:view',
    'database_cluster:view',
    'promise:claim',
    'promise:manage',
    'promise:view',
    'secret:read',
    'workspace:deploy',
    'workspace:manage',
    'workspace:view',
  ],
  PLATFORM_ADMIN: [
    'application:deploy',
    'application:rollback',
    'application:view',
    'audit_log:view',
    'data_access:manage',
    'data_access:mutate',
    'data_access:query',
    'data_access:subscribe',
    'data_access:view',
    'database_cluster:manage',
    'database_cluster:view',
    'promise:claim',
    'promise:manage',
    'promise:view',
    'secret:read',
    'workspace:deploy',
    'workspace:manage',
    'workspace:view',
  ],
  OPERATOR: [
    'application:deploy',
    'application:rollback',
    'application:view',
    'audit_log:view',
    'data_access:manage',
    'data_access:mutate',
    'data_access:query',
    'data_access:subscribe',
    'data_access:view',
    'database_cluster:manage',
    'database_cluster:view',
    'incident:manage',
    'incident:view',
    'promise:claim',
    'promise:manage',
    'promise:view',
    'secret:read',
    'workspace:deploy',
    'workspace:manage',
    'workspace:view',
  ],
  APPROVER: [
    'application:view',
    'approval:action',
    'approval:view',
    'data_access:view',
    'promise:view',
    'workspace:view',
  ],
  EXECUTIVE: [
    'application:view',
    'audit_log:view',
    'data_access:view',
    'promise:view',
    'workspace:view',
  ],
  SUPPORT_ENGINEER: [
    'application:view',
    'data_access:query',
    'data_access:subscribe',
    'data_access:view',
    'incident:manage',
    'incident:view',
    'promise:view',
    'workspace:view',
  ],
  COMPLIANCE_REVIEWER: [
    'application:view',
    'audit_log:view',
    'compliance:manage',
    'compliance:view',
    'data_access:view',
    'promise:view',
    'workspace:view',
  ],
};

/** Resolve the deduplicated set of permissions for one or more roles. */
export function getPermissionsForRoles(roles: readonly BacRole[]): BacPermission[] {
  return [...new Set(roles.flatMap((role) => ROLE_PERMISSIONS[role]))];
}

/** Returns the permissions granted by a single role. */
export function getPermissionsForRole(role: BacRole): readonly BacPermission[] {
  return ROLE_PERMISSIONS[role];
}

/** Check whether a set of roles grants a specific permission. */
export function hasPermission(
  roles: readonly BacRole[] | null | undefined,
  permission: BacPermission,
): boolean {
  if (!roles || roles.length === 0) {
    return false;
  }

  return getPermissionsForRoles(roles).includes(permission);
}
