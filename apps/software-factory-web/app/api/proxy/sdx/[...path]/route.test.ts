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
});
