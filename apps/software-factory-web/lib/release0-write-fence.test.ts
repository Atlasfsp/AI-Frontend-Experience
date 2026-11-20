import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import {
  beginWriteFence,
  isWriteFenceBlocked,
  ownsWriteFence,
  scopedWriteFenceKey,
  scopedCreateFenceKey,
  settleWriteFence,
} from './release0-write-fence';

beforeEach(() => {
  vi.stubGlobal('crypto', webcrypto);
  window.localStorage.clear();
});
afterEach(() => vi.unstubAllGlobals());

it('binds opaque recovery markers to verified principal, tenant and project', async () => {
  const key = await scopedWriteFenceKey('user:alice', 'tenant-a', 'project-a');
  expect(key).toMatch(/^fluxcore:r0:write-fence:v1:[a-f0-9]{64}$/);
  expect(key).not.toMatch(/alice|tenant-a|project-a/);
  expect(await scopedWriteFenceKey('user:bob', 'tenant-a', 'project-a')).not.toBe(key);
  expect(await scopedWriteFenceKey('user:alice', 'tenant-b', 'project-a')).not.toBe(key);
  expect(await scopedWriteFenceKey('user:alice', 'tenant-a', 'project-b')).not.toBe(key);
  await expect(scopedWriteFenceKey(undefined, 'tenant-a', 'project-a')).rejects.toThrow('verified identity');
});

it('blocks another tab, never auto-clears an uncertain result after browser remount', async () => {
  const key = await scopedWriteFenceKey('user:alice', 'tenant-a', 'project-a');
  expect(isWriteFenceBlocked(key)).toBe(false);
  const owner = beginWriteFence(key)!;
  expect(owner).toBeTruthy();
  expect(beginWriteFence(key)).toBeNull();
  expect(ownsWriteFence(owner)).toBe(true);
  expect(settleWriteFence(owner, false)).toBe(true);
  // A new component knows the same scope but not the original command/key/owner.
  expect(isWriteFenceBlocked(key)).toBe(true);
  expect(beginWriteFence(key)).toBeNull();
  expect(settleWriteFence({ key, nonce: webcrypto.randomUUID() }, true)).toBe(false);
  expect(isWriteFenceBlocked(key)).toBe(true);
  expect(settleWriteFence(owner, true)).toBe(true);
  expect(isWriteFenceBlocked(key)).toBe(false);
});

it('never stores a request body, idempotency key, token or raw scope', async () => {
  const key = await scopedWriteFenceKey('person@example.invalid', 'tenant-private', 'project-secret');
  const owner = beginWriteFence(key)!;
  const contents = window.localStorage.getItem(key)!;
  expect(JSON.parse(contents)).toMatchObject({ v: 1, nonce: owner.nonce, status: 'IN_FLIGHT' });
  expect(key + contents).not.toMatch(/person@example|tenant-private|project-secret|secret-payload|access.token|Idempotency-Key/);
  expect(settleWriteFence(owner, false)).toBe(true);
  expect(window.localStorage.getItem(key)).toContain('UNCONFIRMED');
});

it('treats corrupted storage markers and unavailable storage as blocked', async () => {
  const key = await scopedWriteFenceKey('alice', 'a', 'p');
  window.localStorage.setItem(key, '{corrupted');
  expect(isWriteFenceBlocked(key)).toBe(true);
  expect(beginWriteFence(key)).toBeNull();
  expect(settleWriteFence({ key, nonce: webcrypto.randomUUID() }, true)).toBe(false);
  vi.stubGlobal('localStorage', {
    getItem: () => { throw new Error('storage denied'); },
    setItem: () => { throw new Error('storage denied'); },
    removeItem: () => { throw new Error('storage denied'); },
  });
  expect(isWriteFenceBlocked(key)).toBe(true);
  expect(beginWriteFence(key)).toBeNull();
});

it('does not settle another owner's fence or mistake a different scope for recovery', async () => {
  const alice = await scopedWriteFenceKey('alice', 'a', 'p');
  const bob = await scopedWriteFenceKey('bob', 'a', 'p');
  const owner = beginWriteFence(alice)!;
  expect(beginWriteFence(bob)).toBeTruthy();
  expect(settleWriteFence({ key: alice, nonce: webcrypto.randomUUID() }, true)).toBe(false);
  expect(isWriteFenceBlocked(alice)).toBe(true);
  expect(settleWriteFence(owner, true)).toBe(true);
  expect(isWriteFenceBlocked(bob)).toBe(true);
});

it('creates a separate opaque workspace fence for project creation with verified scope', async () => {
  const key = await scopedCreateFenceKey('user:me', 'tenant-a', 'workspace-a');
  const differentUser = await scopedCreateFenceKey('user:other', 'tenant-a', 'workspace-a');
  const differentTenant = await scopedCreateFenceKey('user:me', 'tenant-b', 'workspace-a');
  const differentWorkspace = await scopedCreateFenceKey('user:me', 'tenant-a', 'workspace-b');
  expect(key).toMatch(/^fluxcore:r0:write-fence:v1:[a-f0-9]{64}$/);
  expect(new Set([key, differentUser, differentTenant, differentWorkspace]).size).toBe(4);
  expect(key).not.toBe(await scopedWriteFenceKey('user:me', 'tenant-a', 'workspace-a'));
  await expect(scopedCreateFenceKey(undefined, 'tenant-a', 'workspace-a')).rejects.toThrow('verified identity');
  const owner = beginWriteFence(key)!;
  expect(owner).toBeTruthy();
  expect(settleWriteFence(owner, false)).toBe(true);
  expect(beginWriteFence(key)).toBeNull();
  expect(isWriteFenceBlocked(key)).toBe(true);
  const entry = window.localStorage.getItem(key)!;
  expect(key + entry).not.toMatch(/user:me|tenant-a|workspace-a|secret|Idempotency-Key/);
});
