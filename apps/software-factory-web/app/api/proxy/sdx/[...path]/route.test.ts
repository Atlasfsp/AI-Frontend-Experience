import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockSession } from '@bac/auth';
import { readRequestSession } from '@/lib/auth';
import { GET, POST } from './route';

vi.mock('@/lib/env', () => ({
  loadAppEnv: () => ({ sdxApiUrl: 'http://fluxcore.local' }),
}));
vi.mock('@/lib/auth', () => ({
  readRequestSession: vi.fn(),
}));

const getContext = (path: string[]) => ({ params: Promise.resolve({ path }) });

describe('SDX browser API proxy', () => {
  const fetcher = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
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
});
