import type { BacPermission } from '@bac/auth';

type SdxMethod = 'GET' | 'POST';

type SdxRoutePolicy = {
  method: SdxMethod;
  path: RegExp;
  permission: BacPermission;
};

/**
 * Browser-facing SDX operations are deliberately allowlisted. A route being
 * present on the backend does not by itself make it safe for the web BFF to
 * expose. FluxCore API authorization still makes the tenant/resource decision.
 */
const policies: readonly SdxRoutePolicy[] = [
  { method: 'GET', path: /^v1\/frontend\/providers$/, permission: 'workspace:view' },
  { method: 'POST', path: /^v1\/routing\/decide$/, permission: 'workspace:manage' },
  { method: 'POST', path: /^v1\/workflows\/plans$/, permission: 'workspace:manage' },
  { method: 'POST', path: /^v1\/governance\/authorize$/, permission: 'workspace:deploy' },
  { method: 'GET', path: /^v1\/evidence\/bundles\/[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/, permission: 'workspace:view' },
  { method: 'POST', path: /^v1\/releases\/promote$/, permission: 'application:deploy' },
  { method: 'POST', path: /^v1\/playbooks$/, permission: 'workspace:manage' },
  { method: 'POST', path: /^v1\/evaluation\/gates$/, permission: 'workspace:deploy' },
  { method: 'POST', path: /^v1\/sdlc\/execute$/, permission: 'workspace:deploy' },
  { method: 'GET', path: /^v1\/runs\/[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/, permission: 'workspace:view' },
  { method: 'GET', path: /^v1\/control-plane\/telemetry$/, permission: 'workspace:view' },
  { method: 'POST', path: /^v1\/control-plane\/intake$/, permission: 'workspace:manage' },
  { method: 'POST', path: /^v1\/control-plane\/approvals\/[A-Za-z0-9][A-Za-z0-9._:-]{0,127}\/sign$/, permission: 'approval:action' },
  { method: 'POST', path: /^v1\/control-plane\/repair$/, permission: 'workspace:deploy' },
  { method: 'POST', path: /^v1\/control-plane\/kill-switch$/, permission: 'application:rollback' },
  { method: 'POST', path: /^v1\/workforce\/org\/staff$/, permission: 'workspace:manage' },
  { method: 'POST', path: /^v1\/projects$/, permission: 'workspace:manage' },
  { method: 'GET', path: /^v1\/projects\/read-authorization$/, permission: 'workspace:view' },
  { method: 'GET', path: /^v1\/workforce\/sme\/list$/, permission: 'workspace:view' },
  { method: 'POST', path: /^v1\/workforce\/router\/select$/, permission: 'workspace:manage' },
  { method: 'GET', path: /^v1\/activation\/blueprints$/, permission: 'workspace:view' },
  { method: 'POST', path: /^v1\/activation\/compiler\/compile$/, permission: 'workspace:manage' },
  { method: 'POST', path: /^v1\/activation\/migration\/plan$/, permission: 'workspace:manage' },
  { method: 'POST', path: /^v1\/federation\/verify$/, permission: 'workspace:manage' },
];

/** Returns null for every method/path that is not explicitly exposed to the web app. */
export function resolveSdxPermission(method: string, path: string[]): BacPermission | null {
  if (path.length === 0 || path.some((segment) => !segment || segment.includes('/') || segment.includes('\\'))) {
    return null;
  }
  const policy = policies.find(
    (candidate) => candidate.method === method.toUpperCase() && candidate.path.test(path.join('/')),
  );
  return policy?.permission ?? null;
}
