import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockSession, type BacSession } from '@bac/auth';
import { readRequestSession } from '@/lib/auth';
import { GET, POST, PUT } from './route';

const env = vi.hoisted(() => ({ sdxApiUrl: 'http://fluxcore.local', environment: 'development' }));
vi.mock('@/lib/env', () => ({
  loadAppEnv: () => env,
}));
vi.mock('@/lib/auth', () => ({
  readRequestSession: vi.fn(),
}));

const getContext = (path: string[]) => ({ params: Promise.resolve({ path }) });
const oidc = (roles: BacSession['roles']) =>
  createMockSession({ authMode: 'oidc', accessToken: 'access-token-1', roles, issuer: 'https://auth.example' });

describe('SDX browser API proxy', () => {
  const fetcher = vi.fn();

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    env.environment = 'development';
    vi.stubGlobal('fetch', fetcher);
    vi.mocked(readRequestSession).mockResolvedValue(createMockSession());
    fetcher.mockResolvedValue(new Response('{"ok":true}', { status: 200 }));
  });

  it('forwards an allowlisted read with the authenticated tenant context', async () => {
    const request = new NextRequest('http://localhost/api/proxy/sdx/v1/runs/run-123', {
      headers: { cookie: 'bac_session=browser-secret', 'x-tenant-id': 'forged-tenant' },
    });
    const response = await GET(request, getContext(['v1', 'runs', 'run-123']));

    expect(response.status).toBe(200);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toBe('http://fluxcore.local/v1/runs/run-123');
    expect(new Headers(init.headers).get('x-tenant-id')).toBe('tenant-echo');
    expect(new Headers(init.headers).get('x-fluxcore-tenant-id')).toBe('tenant-echo');
    expect(new Headers(init.headers).get('x-workspace-id')).toBe('workspace-core');
    expect(new Headers(init.headers).get('cookie')).toBeNull();
    expect(new Headers(init.headers).get('authorization')).toBeNull();
  });

  it('checks the matching operation permission before forwarding mutations', async () => {
    vi.mocked(readRequestSession).mockResolvedValue(createMockSession({ roles: ['MEMBER'] }));
    const request = new NextRequest('http://localhost/api/proxy/sdx/v1/releases/promote', {
      method: 'POST',
      body: '{}',
    });
    const response = await POST(request, getContext(['v1', 'releases', 'promote']));

    expect(response.status).toBe(403);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('does not expose unknown paths through the catch-all proxy', async () => {
    const request = new NextRequest('http://localhost/api/proxy/sdx/v1/private/admin', {
      method: 'POST',
      body: '{}',
    });
    const response = await POST(request, getContext(['v1', 'private', 'admin']));

    expect(response.status).toBe(404);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('keeps the agentgateway connection probe available to administrators only', async () => {
    vi.mocked(readRequestSession).mockResolvedValue(createMockSession({ roles: ['MEMBER'] }));
    const path = ['v1', 'admin', 'agentgateway', 'status'];
    const denied = await GET(new NextRequest('http://localhost/api/proxy/sdx/v1/admin/agentgateway/status'), getContext(path));
    expect(denied.status).toBe(403);
    expect(fetcher).not.toHaveBeenCalled();

    vi.mocked(readRequestSession).mockResolvedValue(createMockSession({ roles: ['ADMIN'] }));
    const allowed = await GET(new NextRequest('http://localhost/api/proxy/sdx/v1/admin/agentgateway/status'), getContext(path));
    expect(allowed.status).toBe(200);
    const [target, init] = fetcher.mock.calls[0] as [string, RequestInit];
    expect(String(target)).toBe('http://fluxcore.local/v1/admin/agentgateway/status');
    expect(init.method).toBe('GET');
  });

  it('permits source browsing to viewers and requires workspace management to resolve scopes', async () => {
    vi.mocked(readRequestSession).mockResolvedValue(createMockSession({ roles: ['VIEWER'] }));
    const listPath = ['v1', 'source-control', 'connections'];
    const listed = await GET(new NextRequest('http://localhost/api/proxy/sdx/v1/source-control/connections'), getContext(listPath));
    expect(listed.status).toBe(200);

    const resolvePath = ['v1', 'source-control', 'resolve'];
    const denied = await POST(new NextRequest('http://localhost/api/proxy/sdx/v1/source-control/resolve', { method: 'POST', body: '{}' }), getContext(resolvePath));
    expect(denied.status).toBe(403);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('returns a clean gateway error when the FluxCore API is unavailable', async () => {
    vi.mocked(readRequestSession).mockResolvedValue(createMockSession({ roles: ['ADMIN'] }));
    fetcher.mockRejectedValueOnce(new TypeError('connection refused'));
    const response = await GET(
      new NextRequest('http://localhost/api/proxy/sdx/v1/admin/agentgateway/status'),
      getContext(['v1', 'admin', 'agentgateway', 'status']),
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: 'upstream_unavailable' });
  });

  it('forwards a repository link PUT with the exact body, idempotency key and OIDC bearer token', async () => {
    vi.mocked(readRequestSession).mockResolvedValue(oidc(['ADMIN']));
    const body = JSON.stringify({
      tenant_id: 'tenant-echo',
      expected_version: 3,
      source_selection: { connection_id: 'conn-1', scope: { kind: 'branch', reference: 'main' } },
      commit_sha: 'a'.repeat(40),
    });
    const response = await PUT(
      new NextRequest('http://localhost/api/proxy/sdx/v1/projects/p-1/repository', {
        method: 'PUT',
        body,
        headers: { 'content-type': 'application/json', 'idempotency-key': 'key-12345678', authorization: 'Bearer forged' },
      }),
      getContext(['v1', 'projects', 'p-1', 'repository']),
    );
    expect(response.status).toBe(200);
    const [target, init] = fetcher.mock.calls[0] as [URL, RequestInit];
    expect(String(target)).toBe('http://fluxcore.local/v1/projects/p-1/repository');
    expect(init.method).toBe('PUT');
    expect(init.body).toBe(body);
    const headers = new Headers(init.headers);
    expect(headers.get('authorization')).toBe('Bearer access-token-1');
    expect(headers.get('idempotency-key')).toBe('key-12345678');
  });

  it('denies repository linking to members and plan or staffing decisions to non-approvers', async () => {
    vi.mocked(readRequestSession).mockResolvedValue(oidc(['MEMBER']));
    const link = await PUT(
      new NextRequest('http://localhost/api/proxy/sdx/v1/projects/p-1/repository', { method: 'PUT', body: '{}' }),
      getContext(['v1', 'projects', 'p-1', 'repository']),
    );
    expect(link.status).toBe(403);

    vi.mocked(readRequestSession).mockResolvedValue(oidc(['ADMIN']));
    const decide = await POST(
      new NextRequest('http://localhost/api/proxy/sdx/v1/projects/p-1/engineering-plans/plan-1/decision', { method: 'POST', body: '{}' }),
      getContext(['v1', 'projects', 'p-1', 'engineering-plans', 'plan-1', 'decision']),
    );
    expect(decide.status).toBe(403);
    expect(fetcher).not.toHaveBeenCalled();

    vi.mocked(readRequestSession).mockResolvedValue(oidc(['APPROVER']));
    const approved = await POST(
      new NextRequest('http://localhost/api/proxy/sdx/v1/projects/p-1/team-proposals/team-1/decision', {
        method: 'POST',
        body: JSON.stringify({ tenant_id: 'tenant-echo', expected_version: 4, decision: 'APPROVED', reason: 'ok' }),
      }),
      getContext(['v1', 'projects', 'p-1', 'team-proposals', 'team-1', 'decision']),
    );
    expect(approved.status).toBe(200);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('refuses tenant_id values that differ from the signed session before contacting FluxCore', async () => {
    vi.mocked(readRequestSession).mockResolvedValue(oidc(['ADMIN']));
    const query = await GET(
      new NextRequest('http://localhost/api/proxy/sdx/v1/projects/p-1?tenant_id=tenant-other'),
      getContext(['v1', 'projects', 'p-1']),
    );
    expect(query.status).toBe(403);
    const repeated = await GET(
      new NextRequest('http://localhost/api/proxy/sdx/v1/projects/p-1/decision-events?tenant_id=tenant-echo&tenant_id=tenant-other'),
      getContext(['v1', 'projects', 'p-1', 'decision-events']),
    );
    expect(repeated.status).toBe(403);
    const body = await POST(
      new NextRequest('http://localhost/api/proxy/sdx/v1/control-plane/intake', {
        method: 'POST',
        body: JSON.stringify({ tenant_id: 'tenant-other', title: 't', description: 'd' }),
      }),
      getContext(['v1', 'control-plane', 'intake']),
    );
    expect(body.status).toBe(403);
    expect(await body.json()).toEqual({ error: 'tenant_mismatch' });
    expect(fetcher).not.toHaveBeenCalled();

    const matching = await GET(
      new NextRequest('http://localhost/api/proxy/sdx/v1/projects/p-1?tenant_id=tenant-echo'),
      getContext(['v1', 'projects', 'p-1']),
    );
    expect(matching.status).toBe(200);
    expect(String(fetcher.mock.calls[0]?.[0])).toBe('http://fluxcore.local/v1/projects/p-1?tenant_id=tenant-echo');
  });

  it('rejects non-object JSON and oversized mutation bodies', async () => {
    vi.mocked(readRequestSession).mockResolvedValue(oidc(['ADMIN']));
    const path = ['v1', 'projects', 'p-1', 'engineering-tasks'];
    const invalid = await POST(new NextRequest('http://localhost/x', { method: 'POST', body: '[1]' }), getContext(path));
    expect(invalid.status).toBe(400);
    const broken = await POST(new NextRequest('http://localhost/x', { method: 'POST', body: '{"tenant_id":' }), getContext(path));
    expect(broken.status).toBe(400);
    const large = await POST(new NextRequest('http://localhost/x', { method: 'POST', body: JSON.stringify({ reason: 'x'.repeat(70 * 1024) }) }), getContext(path));
    expect(large.status).toBe(413);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('refuses mock sessions outside development', async () => {
    env.environment = 'production';
    vi.mocked(readRequestSession).mockResolvedValue(createMockSession({ roles: ['ADMIN'] }));
    const response = await GET(new NextRequest('http://localhost/api/proxy/sdx/v1/projects/p-1'), getContext(['v1', 'projects', 'p-1']));
    expect(response.status).toBe(403);
    expect(fetcher).not.toHaveBeenCalled();

    vi.mocked(readRequestSession).mockResolvedValue(oidc(['ADMIN']));
    const verified = await GET(new NextRequest('http://localhost/api/proxy/sdx/v1/projects/p-1'), getContext(['v1', 'projects', 'p-1']));
    expect(verified.status).toBe(200);
  });

  it('cancels a streamed body as soon as it exceeds 64 KiB without fetching upstream', async () => {
    const cancel = vi.fn();
    let chunks = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        chunks++;
        controller.enqueue(new Uint8Array(32 * 1024));
      },
      cancel,
    }, { highWaterMark: 0 });
    const init = { method: 'POST', body, duplex: 'half' as const };
    const response = await POST(new NextRequest('http://localhost/x', init), getContext(['v1', 'control-plane', 'intake']));
    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: 'payload_too_large' });
    expect(chunks).toBe(3);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('rejects a declared oversize body before reading its stream', async () => {
    const pull = vi.fn();
    const cancel = vi.fn();
    const body = new ReadableStream<Uint8Array>({ pull, cancel }, { highWaterMark: 0 });
    const init = { method: 'POST', body, duplex: 'half' as const, headers: { 'content-length': String(64 * 1024 + 1) } };
    const response = await POST(new NextRequest('http://localhost/x', init), getContext(['v1', 'control-plane', 'intake']));
    expect(response.status).toBe(413);
    expect(pull).not.toHaveBeenCalled();
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('rejects malformed UTF-8 instead of replacing bytes inside JSON', async () => {
    const body = new Uint8Array([123, 34, 120, 34, 58, 34, 255, 34, 125]);
    const response = await POST(new NextRequest('http://localhost/x', { method: 'POST', body }), getContext(['v1', 'control-plane', 'intake']));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'invalid_json' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it.each([301, 302, 303, 307, 308])('refuses HTTP %s redirects without forwarding credentials to the redirect target', async (status) => {
    vi.mocked(readRequestSession).mockResolvedValue(oidc(['ADMIN']));
    const cancel = vi.fn();
    fetcher.mockResolvedValueOnce(new Response(new ReadableStream({ cancel }), {
      status,
      headers: { location: 'https://other.example/?token=secret', 'set-cookie': 'token=secret', authorization: 'Bearer secret' },
    }));
    const response = await GET(new NextRequest('http://localhost/x'), getContext(['v1', 'projects', 'p-1']));
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: 'upstream_redirect_refused' });
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(response.headers.get('authorization')).toBeNull();
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [target, init] = fetcher.mock.calls[0] as [URL, RequestInit];
    expect(String(target)).toBe('http://fluxcore.local/v1/projects/p-1');
    expect(init.redirect).toBe('manual');
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer access-token-1');
  });

  it('aborts an upstream timeout and reports an unconfirmed outcome', async () => {
    vi.useFakeTimers();
    fetcher.mockImplementationOnce((_url: URL, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    }));
    const pending = POST(new NextRequest('http://localhost/x', { method: 'POST', body: '{}' }), getContext(['v1', 'control-plane', 'intake']));
    await vi.advanceTimersByTimeAsync(15_000);
    const response = await pending;
    expect(response.status).toBe(504);
    expect(await response.json()).toEqual({ error: 'upstream_timeout_outcome_unconfirmed' });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect((fetcher.mock.calls[0]?.[1] as RequestInit).signal?.aborted).toBe(true);
  });

  it('passes backend conflicts and replay markers through without leaking upstream cookies', async () => {
    vi.mocked(readRequestSession).mockResolvedValue(oidc(['ADMIN']));
    fetcher.mockResolvedValueOnce(
      new Response('{"error":"project version changed"}', {
        status: 409,
        headers: { 'content-type': 'application/json', 'set-cookie': 'upstream=1', 'idempotent-replay': 'true' },
      }),
    );
    const response = await POST(
      new NextRequest('http://localhost/x', { method: 'POST', body: JSON.stringify({ tenant_id: 'tenant-echo', expected_version: 1, intake_id: 'i-1' }) }),
      getContext(['v1', 'projects', 'p-1', 'engineering-plans']),
    );
    expect(response.status).toBe(409);
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(response.headers.get('idempotent-replay')).toBe('true');
    expect(await response.json()).toEqual({ error: 'project version changed' });
  });
});
