import type { BacPermission } from '@bac/auth';

/** Intake planning is governed by workspace management, never deployment authority. */
export function resolveSdxPermission(method: string, path: string[]): BacPermission {
  if (method === 'POST' && path.join('/') === 'v1/activation/compiler/compile') return 'workspace:manage';
  if (method === 'POST' && path.join('/') === 'v1/projects') return 'workspace:manage';
  return method === 'GET' ? 'application:view' : 'application:deploy';
}
