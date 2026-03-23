import type { BacRole, BacSession } from './session';

export type BacPermission =
  | 'application:deploy'
  | 'application:rollback'
  | 'application:view'
  | 'audit_log:view'
  | 'data_access:manage'
  | 'data_access:mutate'
  | 'data_access:query'
  | 'data_access:subscribe'
  | 'data_access:view'
  | 'database_cluster:manage'
  | 'database_cluster:view'
  | 'promise:claim'
  | 'promise:manage'
  | 'promise:view'
  | 'secret:read'
  | 'workspace:deploy'
  | 'workspace:manage'
  | 'workspace:view';

const permissionMatrix: Record<BacRole, BacPermission[]> = {
  VIEWER: ['application:view', 'data_access:view', 'promise:view', 'workspace:view'],
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
    'promise:claim',
    'promise:manage',
    'promise:view',
    'secret:read',
    'workspace:deploy',
    'workspace:manage',
    'workspace:view',
  ],
};

export function getPermissionsForRoles(roles: BacRole[]): BacPermission[] {
  return [...new Set(roles.flatMap((role) => permissionMatrix[role]))];
}

export function hasPermission(
  session: Pick<BacSession, 'roles'> | null,
  permission: BacPermission,
): boolean {
  if (!session) {
    return false;
  }

  return getPermissionsForRoles(session.roles).includes(permission);
}
