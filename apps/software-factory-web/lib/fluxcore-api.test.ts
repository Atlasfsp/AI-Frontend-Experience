import { describe, expect, it, vi } from 'vitest';

import { callFluxCore, describeFailure, FluxCoreApiError, IdempotencyKeys } from './fluxcore-api';

function json(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
}

describe('callFluxCore', () => {
  it('reuses the Idempotency-Key for retries after 5xx or network failures and rotates it after a definitive answer', async () => {
    const keys = new IdempotencyKeys();
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(json(503, { status: 'NOT_CONNECTED', error: 'not configured' }))
      .mockResolvedValueOnce(json(201, { ok: true }))
      .mockResolvedValueOnce(json(201, { ok: true }));
    const body = { tenant_id: 't', expected_version: 2 };
    await expect(callFluxCore('POST', 'v1/x', { body, keys, fetcher })).rejects.toThrow('offline');
    await expect(callFluxCore('POST', 'v1/x', { body, keys, fetcher })).rejects.toMatchObject({ status: 503 });
    await callFluxCore('POST', 'v1/x', { body, keys, fetcher });
    await callFluxCore('POST', 'v1/x', { body, keys, fetcher });
    const sent = fetcher.mock.calls.map((call) => (call[1] as RequestInit & { headers: Record<string, string> }).headers['Idempotency-Key']);
    expect(sent[0]).toBe(sent[1]);
    expect(sent[1]).toBe(sent[2]);
    expect(sent[3]).not.toBe(sent[2]);
    expect(sent[0]!.length).toBeGreaterThanOrEqual(8);
  });

  it('uses distinct keys for different request bodies and rotates after a conflict', async () => {
    const keys = new IdempotencyKeys();
    const fetcher = vi.fn().mockResolvedValue(json(409, { error: 'project version changed' }));
    await expect(callFluxCore('POST', 'v1/x', { body: { v: 1 }, keys, fetcher })).rejects.toBeInstanceOf(FluxCoreApiError);
    await expect(callFluxCore('POST', 'v1/x', { body: { v: 1 }, keys, fetcher })).rejects.toBeInstanceOf(FluxCoreApiError);
    await expect(callFluxCore('POST', 'v1/x', { body: { v: 2 }, keys, fetcher })).rejects.toBeInstanceOf(FluxCoreApiError);
    const sent = fetcher.mock.calls.map((call) => (call[1] as { headers: Record<string, string> }).headers['Idempotency-Key']);
    expect(new Set(sent).size).toBe(3);
  });

  it('sends reads without keys or bodies and reports replays', async () => {
    const fetcher = vi.fn().mockResolvedValue(json(200, { ok: true }, { 'idempotent-replay': 'true' }));
    const result = await callFluxCore('GET', 'v1/projects/p?tenant_id=t', { keys: new IdempotencyKeys(), fetcher });
    const [url, init] = fetcher.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(url).toBe('/api/proxy/sdx/v1/projects/p?tenant_id=t');
    expect(init.body).toBeUndefined();
    expect(init.headers['Idempotency-Key']).toBeUndefined();
    expect(result.replayed).toBe(true);
  });

  it('surfaces backend gate reasons without claiming success', async () => {
    const fetcher = vi.fn().mockResolvedValue(json(409, { error: 'engineering tasks require a current approved engineering plan', reason: 'PLAN_STALE_REPOSITORY' }));
    const failure = await callFluxCore('POST', 'v1/x', { body: {}, fetcher }).catch((error: unknown) => error);
    expect(failure).toMatchObject({ status: 409, reason: 'PLAN_STALE_REPOSITORY' });
    expect(describeFailure(failure)).toContain('PLAN_STALE_REPOSITORY');
    expect(describeFailure(new TypeError('x'))).toContain('Nothing was confirmed as saved');
  });
});
