import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NextRequest } from 'next/server';

import { GET, POST } from './route';

vi.mock('@bac/auth', () => ({ hasPermission: () => true }));
vi.mock('@/lib/auth', () => ({ readRequestSession: async () => ({
  accessToken: 'signed-token', tenantId: 'tenant-a', workspaceId: 'workspace-a',
}) }));
vi.mock('@/lib/env', () => ({ loadAppEnv: () => ({
  hasuraUrl: 'http://hasura.local/v1/graphql',
  sdxApiUrl: 'http://fluxcore.local',
}) }));

const fetcher = vi.fn<typeof fetch>();

function context(path = ['v1', 'graphql']) {
  return { params: Promise.resolve({ path }) };
}

describe('Hasura BFF project authorization', () => {
  beforeEach(() => {
    fetcher.mockReset();
    vi.stubGlobal('fetch', fetcher);
  });

  it('does not proxy a project read when SpiceDB denies it', async () => {
    fetcher.mockResolvedValue(new Response('{}', { status: 403 }));
    const request = new NextRequest('http://localhost/api/proxy/hasura/v1/graphql', {
      method: 'POST',
      headers: { cookie: 'bac_session=signed-session', 'content-type': 'application/json' },
      body: JSON.stringify({ query: 'query { fluxcore_project_read_model { id } }' }),
    });

    const response = await POST(request, context());

    expect(response.status).toBe(403);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0]?.[0]).toBe('http://fluxcore.local/v1/projects/read-authorization');
  });

  it('checks SpiceDB before forwarding an authorized project query to the exact GraphQL URL', async () => {
    fetcher
      .mockResolvedValueOnce(new Response(JSON.stringify({ authorized: true }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { fluxcore_project_read_model: [] } }), { status: 200 }));
    const request = new NextRequest('http://localhost/api/proxy/hasura/v1/graphql', {
      method: 'POST',
      headers: { cookie: 'bac_session=signed-session', 'content-type': 'application/json' },
      body: JSON.stringify({ query: 'query { projects: fluxcore_project_read_model { id } }' }),
    });

    const response = await POST(request, context());

    expect(response.status).toBe(200);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(String(fetcher.mock.calls[1]?.[0])).toBe('http://hasura.local/v1/graphql');
  });

  it('keeps unrelated queries out of the project permission path and restricts proxy paths', async () => {
    fetcher.mockResolvedValue(new Response(JSON.stringify({ data: { health: { ok: true } } }), { status: 200 }));
    const request = new NextRequest('http://localhost/api/proxy/hasura/v1/graphql?query=query%20%7Bhealth%7Bok%7D%7D', {
      method: 'GET',
      headers: { cookie: 'bac_session=signed-session' },
    });
    const response = await GET(request, context());
    expect(response.status).toBe(200);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(new URL(String(fetcher.mock.calls[0]?.[0])).pathname).toBe('/v1/graphql');

    const blocked = await GET(request, context(['v1', 'metadata']));
    expect(blocked.status).toBe(404);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('rejects alternate GraphQL encodings that cannot be inspected before forwarding', async () => {
    fetcher.mockResolvedValue(new Response('{}', { status: 200 }));
    const rawGraphQL = new NextRequest('http://localhost/api/proxy/hasura/v1/graphql', {
      method: 'POST',
      headers: { cookie: 'bac_session=signed-session', 'content-type': 'application/graphql' },
      body: 'query { fluxcore_project_read_model { id } }',
    });
    const multipartGraphQL = new NextRequest('http://localhost/api/proxy/hasura/v1/graphql', {
      method: 'POST',
      headers: { cookie: 'bac_session=signed-session', 'content-type': 'multipart/form-data; boundary=graphql-boundary' },
      body: '--graphql-boundary\r\ncontent-disposition: form-data; name="operations"\r\n\r\n{"query":"query { fluxcore_project_read_model { id } }"}\r\n--graphql-boundary--\r\n',
    });
    const persistedOnly = new NextRequest('http://localhost/api/proxy/hasura/v1/graphql', {
      method: 'POST',
      headers: { cookie: 'bac_session=signed-session', 'content-type': 'application/json' },
      body: JSON.stringify({ extensions: { persistedQuery: { sha256Hash: 'opaque' } } }),
    });

    expect((await POST(rawGraphQL, context())).status).toBe(415);
    expect((await POST(multipartGraphQL, context())).status).toBe(415);
    expect((await POST(persistedOnly, context())).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
