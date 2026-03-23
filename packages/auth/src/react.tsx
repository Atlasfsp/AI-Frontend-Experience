'use client';

import { createContext, useContext } from 'react';

import type { BacRole, BacSession } from './session';
import { hasRole } from './session';
import type { BacPermission } from './permissions';
import { hasPermission } from './permissions';

const SessionContext = createContext<BacSession | null>(null);

export function AuthProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: BacSession | null;
}) {
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useBacSession() {
  return useContext(SessionContext);
}

export function useBacAccess(requiredRoles: BacRole[]) {
  const session = useBacSession();
  return hasRole(session, requiredRoles);
}

export function useBacPermission(permission: BacPermission) {
  const session = useBacSession();
  return hasPermission(session, permission);
}
