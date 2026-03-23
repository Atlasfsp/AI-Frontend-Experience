'use client';

import type { ReactNode } from 'react';

import type { BacPermission } from './permissions';
import type { BacRole } from './session';
import { useBacAccess, useBacPermission } from './react';

export function RoleGuard({
  children,
  fallback,
  roles,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  roles: BacRole[];
}) {
  const allowed = useBacAccess(roles);
  return allowed ? <>{children}</> : <>{fallback ?? null}</>;
}

export function PermissionGuard({
  children,
  fallback,
  permission,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  permission: BacPermission;
}) {
  const allowed = useBacPermission(permission);
  return allowed ? <>{children}</> : <>{fallback ?? null}</>;
}
