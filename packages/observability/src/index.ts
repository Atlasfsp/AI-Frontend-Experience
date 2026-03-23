export { createLogger } from './logger';
export type { LogContext } from './logger';
export { recordMetric } from './metrics';
export { withSpan } from './tracing';

// Governance audit trail
export {
  logGovernanceAction,
  getGovernanceAuditLog,
  clearGovernanceAuditLog,
} from './governance-audit';
export type { GovernanceAuditEntry } from './governance-audit';

// Tenant-scoped audit trail
export type { TenantAuditEntry } from './tenant-audit';
export { flushTenantAuditLog, getTenantAuditLog, logTenantAction } from './tenant-audit';
