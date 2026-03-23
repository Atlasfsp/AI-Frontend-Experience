/**
 * Tenant-scoped audit logger.
 * All actions are tagged with tenant context for compliance and traceability.
 */

export interface TenantAuditEntry {
  id: string;
  timestamp: string;
  tenantId: string;
  workspaceId: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  outcome: 'success' | 'failure' | 'denied';
  governanceMode: 'HOTL' | 'HITL' | 'FULL_AUTONOMY';
  metadata?: Record<string, unknown>;
}

const tenantAuditBuffer: TenantAuditEntry[] = [];
const MAX_BUFFER = 100;

export function logTenantAction(entry: Omit<TenantAuditEntry, 'id' | 'timestamp'>): TenantAuditEntry {
  const full: TenantAuditEntry = {
    ...entry,
    id: `ta-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  };

  tenantAuditBuffer.push(full);
  if (tenantAuditBuffer.length > MAX_BUFFER) tenantAuditBuffer.shift();

  console.info('[tenant-audit]', JSON.stringify(full));
  return full;
}

export function getTenantAuditLog(tenantId?: string): TenantAuditEntry[] {
  if (!tenantId) return [...tenantAuditBuffer];
  return tenantAuditBuffer.filter(e => e.tenantId === tenantId);
}

export function flushTenantAuditLog(): TenantAuditEntry[] {
  const flushed = [...tenantAuditBuffer];
  tenantAuditBuffer.length = 0;
  return flushed;
}
