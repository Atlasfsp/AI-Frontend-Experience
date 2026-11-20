/**
 * Conservative, scope-bound write fence for Release 0.
 *
 * Stores only a salted-by-namespace SHA-256 scope key and a random opaque nonce.
 * No request body, session cookie or access token is persisted. New command
 * locators reuse the random nonce as the backend idempotency key.
 * An unresolved marker deliberately never expires or auto-clears: only an
 * original live component with the exact replay data can settle the request.
 * On remount/full reload the frontend MUST fail closed pending server-side
 * authorized reconciliation. This is not an execution grant or a distributed
 * mutual-exclusion primitive; backend CAS/idempotency remain authoritative.
 */
const prefix = 'fluxcore:r0:write-fence:v1:';

export type WriteFence = { key: string; nonce: string; expected?: string };
export type RecoveryCommand = {
  command: 'PROJECT_CREATE' | 'INTAKE_CREATE' | 'INTAKE_TRIAGE' | 'REPOSITORY_LINK' |
    'PLAN_CREATE' | 'PLAN_DECIDE' | 'STAFFING_CREATE' | 'STAFFING_DECIDE' | 'TASKS_CREATE' | 'TASK_CANCEL';
  resourceId?: string;
};
type StoredFence = { v: 1; nonce: string; status: 'IN_FLIGHT' | 'UNCONFIRMED'; recovery?: RecoveryCommand };
const commands = new Set(['PROJECT_CREATE', 'INTAKE_CREATE', 'INTAKE_TRIAGE', 'REPOSITORY_LINK',
  'PLAN_CREATE', 'PLAN_DECIDE', 'STAFFING_CREATE', 'STAFFING_DECIDE', 'TASKS_CREATE', 'TASK_CANCEL']);

function validRecovery(value: unknown): value is RecoveryCommand {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  if (typeof row.command !== 'string' || !commands.has(row.command) ||
    Object.keys(row).some((key) => key !== 'command' && key !== 'resourceId')) return false;
  const needsResource = ['INTAKE_TRIAGE', 'PLAN_DECIDE', 'STAFFING_DECIDE', 'TASK_CANCEL'].includes(row.command);
  return needsResource
    ? typeof row.resourceId === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(row.resourceId)
    : row.resourceId === undefined;
}

function parse(value: string | null): StoredFence | null {
  if (!value) return null;
  try {
    const row = JSON.parse(value) as Partial<StoredFence>;
    if (row.v !== 1 || typeof row.nonce !== 'string' ||
      !/^[0-9a-f-]{36}$/i.test(row.nonce) ||
      (row.status !== 'IN_FLIGHT' && row.status !== 'UNCONFIRMED') ||
      (row.recovery !== undefined && !validRecovery(row.recovery))) return null;
    return row as StoredFence;
  } catch {
    return null;
  }
}

export async function scopedWriteFenceKey(subject: string | undefined, tenantId: string, projectId: string): Promise<string> {
  if (!subject?.trim() || !tenantId.trim() || !projectId.trim() ||
    !globalThis.crypto?.subtle || !globalThis.crypto?.randomUUID) {
    throw new Error('verified identity and Web Crypto required for safe mutation recovery');
  }
  const bytes = new TextEncoder().encode(JSON.stringify(['fluxcore-r0', subject, tenantId, projectId]));
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return prefix + Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Separate creation scope: the project ID does not exist until after POST.
 * One unresolved project-create request blocks a workspace's new project writes
 * until its original live owner retries or an operator reconciles the backend.
 * No request body, idempotency key, name or token is stored in the browser.
 */
export async function scopedCreateFenceKey(
  subject: string | undefined, tenantId: string, workspaceId: string,
): Promise<string> {
  if (!subject?.trim() || !tenantId.trim() || !workspaceId.trim() ||
    !globalThis.crypto?.subtle || !globalThis.crypto?.randomUUID) {
    throw new Error('verified identity and Web Crypto required for safe create recovery');
  }
  const bytes = new TextEncoder().encode(
    JSON.stringify(['fluxcore-r0-create', subject, tenantId, workspaceId]),
  );
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return prefix + Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Unknown/malformed/blocked storage is never treated as clear. */
export function isWriteFenceBlocked(key: string): boolean {
  try {
    return globalThis.localStorage.getItem(key) !== null;
  } catch {
    return true;
  }
}

/**
 * Best-effort same-origin tab coordination, not an atomic cross-tab lock.
 * Existing markers block; backend tenant-scope, CAS and idempotency must still
 * reject collisions that occur during simultaneous tab reservation.
 */
export function beginWriteFence(key: string): WriteFence | null {
  try {
    const storage = globalThis.localStorage;
    if (storage.getItem(key) !== null) return null;
    const nonce = globalThis.crypto.randomUUID();
    const payload = JSON.stringify({ v: 1, nonce, status: 'IN_FLIGHT' } satisfies StoredFence);
    storage.setItem(key, payload);
    if (storage.getItem(key) !== payload) return null;
    return { key, nonce };
  } catch {
    return null;
  }
}

export function ownsWriteFence(fence: WriteFence): boolean {
  try {
    const raw = globalThis.localStorage.getItem(fence.key);
    return (fence.expected === undefined || raw === fence.expected) && parse(raw)?.nonce === fence.nonce;
  } catch {
    return false;
  }
}

/** Persist a payload-free locator before HTTP. A legacy marker is never
 * assumed to have used its nonce as the original backend key.
 */
export function prepareWriteFence(fence: WriteFence, recovery: RecoveryCommand): boolean {
  try {
    const row = parse(globalThis.localStorage.getItem(fence.key));
    if (!row || row.nonce !== fence.nonce || !validRecovery(recovery) ||
      (row.recovery && JSON.stringify(row.recovery) !== JSON.stringify(recovery))) return false;
    const payload = JSON.stringify({ ...row, recovery });
    globalThis.localStorage.setItem(fence.key, payload);
    return globalThis.localStorage.getItem(fence.key) === payload;
  } catch { return false; }
}

/** Read-only recovery. The caller may retire this exact marker only after a
 * COMMITTED result, never after UNKNOWN, denial, auth changes or unavailable
 * storage. No request payload is reconstructed or submitted.
 */
export async function readWriteFenceOutcome(key: string, tenantId: string, projectId?: string) {
  const raw = globalThis.localStorage.getItem(key);
  const row = parse(raw);
  if (!row?.recovery) throw new Error('Original command locator is unavailable; authorized operator recovery is required.');
  const { command, resourceId } = row.recovery;
  const intake = command.startsWith('INTAKE_');
  const needsProject = !intake && command !== 'PROJECT_CREATE';
  if (needsProject !== !!projectId && !intake) throw new Error('Recovery scope is invalid.');
  const query = new URLSearchParams({ tenant_id: tenantId, command });
  if (needsProject && projectId) query.set('project_id', projectId);
  if (resourceId) query.set('resource_id', resourceId);
  const path = intake ? 'v1/control-plane/intake/command-outcome' : 'v1/projects/command-outcome';
  const response = await fetch(`/api/proxy/sdx/${path}?${query}`, {
    method: 'GET', cache: 'no-store',
    headers: { accept: 'application/json', 'Idempotency-Key': row.nonce },
  });
  if (!response.ok) throw new Error(`Recovery unavailable or denied (HTTP ${response.status}). The original outcome remains unknown.`);
  const result = await response.json() as Record<string, unknown>;
  if (globalThis.localStorage.getItem(key) !== raw) throw new Error('Recovery marker changed; new changes remain blocked.');
  if (result?.execution_authorized !== false || !['COMMITTED', 'UNKNOWN'].includes(String(result.outcome))) {
    throw new Error('Unsupported recovery response; new changes remain blocked.');
  }
  if (result.outcome === 'UNKNOWN') return { outcome: 'UNKNOWN' as const };
  if (typeof result.resource_id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(result.resource_id) ||
    (resourceId && resourceId !== result.resource_id) ||
    (projectId && !intake && result.project_id !== projectId) ||
    (projectId && result.project_id !== undefined && result.project_id !== projectId) ||
    (command === 'PROJECT_CREATE' && result.project_id !== result.resource_id)) {
    throw new Error('Recovery response scope mismatch; new changes remain blocked.');
  }
  return {
    outcome: 'COMMITTED' as const, fence: { key, nonce: row.nonce, expected: raw! },
    projectId: typeof result.project_id === 'string' ? result.project_id : undefined,
    resourceId: result.resource_id,
  };
}

/** Retire only after a definitive live response or an authorized COMMITTED lookup. */
export function settleWriteFence(fence: WriteFence, confirmed: boolean): boolean {
  try {
    if (!ownsWriteFence(fence)) return false;
    if (confirmed) {
      globalThis.localStorage.removeItem(fence.key);
      return globalThis.localStorage.getItem(fence.key) === null;
    }
    globalThis.localStorage.setItem(
      fence.key,
      JSON.stringify({ ...parse(globalThis.localStorage.getItem(fence.key))!, status: 'UNCONFIRMED' } satisfies StoredFence),
    );
    return ownsWriteFence(fence);
  } catch {
    return false;
  }
}
