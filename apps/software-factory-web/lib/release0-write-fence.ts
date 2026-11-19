/**
 * Conservative, scope-bound write fence for Release 0.
 *
 * Stores only a salted-by-namespace SHA-256 scope key and a random opaque nonce.
 * No request body, idempotency key, session cookie or access token is persisted.
 * An unresolved marker deliberately never expires or auto-clears: only an
 * original live component with the exact replay data can settle the request.
 * On remount/full reload the frontend MUST fail closed pending server-side
 * authorized reconciliation. This is not an execution grant or a distributed
 * mutual-exclusion primitive; backend CAS/idempotency remain authoritative.
 */
const prefix = 'fluxcore:r0:write-fence:v1:';

export type WriteFence = { key: string; nonce: string };
type StoredFence = { v: 1; nonce: string; status: 'IN_FLIGHT' | 'UNCONFIRMED' };

function parse(value: string | null): StoredFence | null {
  if (!value) return null;
  try {
    const row = JSON.parse(value) as Partial<StoredFence>;
    if (row.v !== 1 || typeof row.nonce !== 'string' ||
      !/^[0-9a-f-]{36}$/i.test(row.nonce) ||
      (row.status !== 'IN_FLIGHT' && row.status !== 'UNCONFIRMED')) return null;
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
    return parse(globalThis.localStorage.getItem(fence.key))?.nonce === fence.nonce;
  } catch {
    return false;
  }
}

/** Only the original live owner can retire a confirmed write marker. */
export function settleWriteFence(fence: WriteFence, confirmed: boolean): boolean {
  try {
    if (!ownsWriteFence(fence)) return false;
    if (confirmed) {
      globalThis.localStorage.removeItem(fence.key);
      return globalThis.localStorage.getItem(fence.key) === null;
    }
    globalThis.localStorage.setItem(
      fence.key,
      JSON.stringify({ v: 1, nonce: fence.nonce, status: 'UNCONFIRMED' } satisfies StoredFence),
    );
    return ownsWriteFence(fence);
  } catch {
    return false;
  }
}
