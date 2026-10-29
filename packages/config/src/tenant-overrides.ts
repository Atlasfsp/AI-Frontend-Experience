/**
 * Per-tenant feature flag overrides.
 * Tenant-specific flags take precedence over global flags.
 */

export interface TenantFlagOverride {
  tenantId: string;
  flags: Record<string, boolean | string>;
  expiresAt?: string;
}

const overrides: Map<string, TenantFlagOverride> = new Map();

export function setTenantOverrides(tenantId: string, flags: Record<string, boolean | string>, expiresAt?: string): void {
  overrides.set(tenantId, { tenantId, flags, ...(expiresAt === undefined ? {} : { expiresAt }) });
}

export function getTenantOverride(tenantId: string, flagName: string): boolean | string | undefined {
  const override = overrides.get(tenantId);
  if (!override) return undefined;
  if (override.expiresAt && new Date(override.expiresAt) < new Date()) {
    overrides.delete(tenantId);
    return undefined;
  }
  return override.flags[flagName];
}

export function clearTenantOverrides(tenantId: string): void {
  overrides.delete(tenantId);
}

export function resolveFlagWithTenantOverride<T>(tenantId: string | undefined, flagName: string, defaultValue: T): T {
  if (!tenantId) return defaultValue;
  const override = getTenantOverride(tenantId, flagName);
  if (override !== undefined) return override as unknown as T;
  return defaultValue;
}
