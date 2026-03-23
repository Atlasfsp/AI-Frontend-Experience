/**
 * Tenant context extraction and validation for BFF proxy routes.
 * Ensures every API call is scoped to the authenticated tenant.
 */

export interface TenantContext {
  tenantId: string;
  workspaceId: string;
  region: string;
  userId: string;
  roles: string[];
}

/**
 * Extract tenant context from request headers.
 * These headers are set by the auth middleware after JWT validation.
 */
export function extractTenantContext(headers: Headers): TenantContext | null {
  const tenantId = headers.get('x-bac-tenant-id');
  const workspaceId = headers.get('x-bac-workspace-id');
  const region = headers.get('x-bac-region');
  const userId = headers.get('x-bac-user-id');
  const roles = headers.get('x-bac-roles');

  if (!tenantId || !workspaceId || !userId) return null;

  return {
    tenantId,
    workspaceId,
    region: region || 'ng',
    userId,
    roles: roles ? roles.split(',') : [],
  };
}

/**
 * Validate that a request's tenant context matches the session.
 * Prevents tenant ID spoofing via header injection.
 */
export function validateTenantContext(requestContext: TenantContext, sessionTenantId: string): boolean {
  return requestContext.tenantId === sessionTenantId;
}

/**
 * Create tenant-scoped headers for upstream API calls.
 * These are injected by the BFF proxy before forwarding to backend.
 */
export function createTenantHeaders(context: TenantContext): Record<string, string> {
  return {
    'X-Bac-Tenant-Id': context.tenantId,
    'X-Bac-Workspace-Id': context.workspaceId,
    'X-Bac-Region': context.region,
    'X-Bac-User-Id': context.userId,
    'X-Bac-Roles': context.roles.join(','),
  };
}
