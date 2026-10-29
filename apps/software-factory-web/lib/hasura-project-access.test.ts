import { describe, expect, it, vi } from 'vitest';

import { authorizeEngineeringProjectRead, queryReadsEngineeringProjects } from './hasura-project-access';

describe('Hasura project read authorization', () => {
  it('recognizes the protected view even when GraphQL aliases it', () => {
    expect(queryReadsEngineeringProjects('query { projects: fluxcore_project_read_model { id } }')).toBe(true);
    expect(queryReadsEngineeringProjects('query { health { ok } }')).toBe(false);
    expect(queryReadsEngineeringProjects(undefined)).toBe(false);
  });

  it('requires a signed access token and a positive SpiceDB authorization response', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ authorized: true }), { status: 200 }));
    await expect(authorizeEngineeringProjectRead('http://fluxcore.local/', undefined, fetcher)).resolves.toBe('missing_token');
    expect(fetcher).not.toHaveBeenCalled();
    await expect(authorizeEngineeringProjectRead('http://fluxcore.local/', 'signed-token', fetcher)).resolves.toBe('allowed');
    expect(fetcher).toHaveBeenCalledWith('http://fluxcore.local/v1/projects/read-authorization', expect.objectContaining({
      headers: { authorization: 'Bearer signed-token' },
      cache: 'no-store',
    }));
  });

  it('fails closed on denial, authorization outage, and an invalid decision body', async () => {
    const denied = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}', { status: 403 }));
    const unavailable = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 503 }));
    const malformed = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ authorized: 'true' }), { status: 200 }));
    await expect(authorizeEngineeringProjectRead('http://fluxcore.local', 'token', denied)).resolves.toBe('denied');
    await expect(authorizeEngineeringProjectRead('http://fluxcore.local', 'token', unavailable)).resolves.toBe('unavailable');
    await expect(authorizeEngineeringProjectRead('http://fluxcore.local', 'token', malformed)).resolves.toBe('denied');
  });
});
