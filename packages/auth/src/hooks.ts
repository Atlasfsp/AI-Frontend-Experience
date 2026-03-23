'use client';

import { useBacSession } from './react';
import type { BacPermission } from './permissions';
import { hasPermission } from './permissions';

export function useTenant() {
  return useBacSession()?.tenantId ?? null;
}

export function useWorkspace() {
  return useBacSession()?.workspaceId ?? null;
}

export function usePermission(permission: BacPermission) {
  const session = useBacSession();
  return hasPermission(session, permission);
}
