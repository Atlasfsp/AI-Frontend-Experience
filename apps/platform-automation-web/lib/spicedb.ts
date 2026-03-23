import type { BacPermission, BacSession } from '@bac/auth';
import { hasPermission } from '@bac/auth';

const routePermissions: Array<{ permission: BacPermission; prefix: string }> = [
  { prefix: '/api-explorer', permission: 'workspace:view' },
  { prefix: '/platform/identity', permission: 'secret:read' },
  { prefix: '/platform/workspace-factory', permission: 'workspace:manage' },
  { prefix: '/platform/incidents', permission: 'audit_log:view' },
  { prefix: '/platform/policy', permission: 'audit_log:view' },
  { prefix: '/platform/quotas', permission: 'workspace:view' },
  { prefix: '/platform/runbooks', permission: 'workspace:view' },
  { prefix: '/platform/gitops', permission: 'database_cluster:view' },
  { prefix: '/platform/regions', permission: 'database_cluster:view' },
  { prefix: '/platform/graphql-explorer', permission: 'data_access:view' },
  { prefix: '/platform/data-access', permission: 'data_access:view' },
  { prefix: '/platform/promises', permission: 'promise:view' },
  { prefix: '/platform/fleet', permission: 'database_cluster:view' },
  { prefix: '/platform/networking', permission: 'database_cluster:view' },
  { prefix: '/platform/compliance', permission: 'audit_log:view' },
  { prefix: '/platform/observability', permission: 'audit_log:view' },
  { prefix: '/platform/workspaces', permission: 'workspace:view' },
  { prefix: '/platform/clusters', permission: 'database_cluster:view' },
  { prefix: '/platform', permission: 'workspace:view' },
];

export function getRequiredPermission(pathname: string): BacPermission | null {
  return routePermissions.find((entry) => pathname.startsWith(entry.prefix))?.permission ?? null;
}

export function canAccessPath(session: BacSession | null, pathname: string) {
  const permission = getRequiredPermission(pathname);

  if (!permission) {
    return true;
  }

  return hasPermission(session, permission);
}
