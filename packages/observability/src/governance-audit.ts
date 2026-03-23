/**
 * Governance audit trail for BAC platform.
 * Logs all governance-gated actions with mode, user, timestamp, and outcome.
 */

export interface GovernanceAuditEntry {
  id: string;
  timestamp: string;
  mode: 'HOTL' | 'HITL' | 'FULL_AUTONOMY';
  action: string;
  resourceType: 'approval' | 'incident' | 'alert' | 'workspace' | 'build';
  resourceId: string;
  userId: string;
  outcome: 'confirmed' | 'cancelled' | 'auto-executed' | 'second-review-requested';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
}

const auditLog: GovernanceAuditEntry[] = [];

export function logGovernanceAction(entry: Omit<GovernanceAuditEntry, 'id' | 'timestamp'>): GovernanceAuditEntry {
  const fullEntry: GovernanceAuditEntry = {
    ...entry,
    id: `gov-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  };
  auditLog.push(fullEntry);

  // Also log to console for observability pipeline pickup
  console.info('[governance-audit]', JSON.stringify(fullEntry));

  // Also send to backend audit endpoint (fire-and-forget)
  if (typeof fetch !== 'undefined' && process.env.NEXT_PUBLIC_BAC_API_URL) {
    fetch(`${process.env.NEXT_PUBLIC_BAC_API_URL}/v1/audit/governance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullEntry),
    }).catch(() => { /* fire-and-forget */ });
  }

  return fullEntry;
}

export function getGovernanceAuditLog(): GovernanceAuditEntry[] {
  return [...auditLog];
}

export function clearGovernanceAuditLog(): void {
  auditLog.length = 0;
}
