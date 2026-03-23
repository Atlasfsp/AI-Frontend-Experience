import type { BacPermission, BacSession } from '@bac/auth';
import { hasPermission } from '@bac/auth';

const routePermissions: Array<{ permission: BacPermission; prefix: string }> = [
  { prefix: '/software-factory/release-manager', permission: 'application:deploy' },
  { prefix: '/software-factory/prd-intake', permission: 'workspace:manage' },
  { prefix: '/software-factory/settings/audit', permission: 'audit_log:view' },
  { prefix: '/software-factory/settings/access', permission: 'workspace:manage' },
  { prefix: '/software-factory/swagger', permission: 'workspace:view' },
  { prefix: '/software-factory/api-contracts', permission: 'workspace:view' },
  { prefix: '/api-explorer', permission: 'workspace:view' },
  { prefix: '/software-factory/compliance', permission: 'application:view' },
  { prefix: '/software-factory/artifacts', permission: 'application:view' },
  { prefix: '/software-factory/builds', permission: 'application:view' },
  { prefix: '/software-factory/work-items', permission: 'workspace:view' },
  { prefix: '/software-factory/workspaces', permission: 'workspace:view' },
  { prefix: '/software-factory/architecture', permission: 'application:view' },
  { prefix: '/software-factory/domain-model', permission: 'application:view' },
  { prefix: '/software-factory/adrs', permission: 'application:view' },
  { prefix: '/software-factory/activity', permission: 'application:view' },
  { prefix: '/software-factory/settings', permission: 'workspace:view' },
  { prefix: '/software-factory', permission: 'workspace:view' },
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
