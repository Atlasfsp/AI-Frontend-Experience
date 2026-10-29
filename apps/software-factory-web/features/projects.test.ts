import { describe, expect, it, vi } from 'vitest';

import { listSharedEngineeringProjects } from './projects';

describe('shared engineering projects read model', () => {
  it('queries Hasura with the signed session token and returns the project SME proposal', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ authorized: true }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              fluxcore_project_read_model: [
                {
                  id: 'project-123',
                  name: 'Care Planner',
                  outcome: 'Coordinate patient appointments',
                  application_domain: 'HealthTech',
                  repository_ref: '',
                  status: 'PROPOSED',
                  version: 1,
                  updated_at: '2026-10-29T00:00:00Z',
                  workforce_plan_json: {
                    status: 'PROPOSED',
                    evidence_status: 'UNVERIFIED',
                    execution_authorized: false,
                    roles: [
                      { role_id: 'healthtech-sme' },
                      { role_id: 'engineer' },
                    ],
                    expert: {
                      name: 'AI HealthTech Subject Matter Expert (Unverified)',
                    },
                  },
                },
              ],
            },
          }),
          { status: 200 },
        ),
      );

    const result = await listSharedEngineeringProjects(
      'http://hasura.local/v1/graphql',
      'http://fluxcore.local/v1/projects/read-authorization',
      'signed-access-token',
      fetcher,
    );

    expect(result.status).toBe('available');
    if (result.status !== 'available')
      throw new Error('expected an available read model');
    expect(result.projects[0]?.id).toBe('project-123');
    expect(result.projects[0]?.version).toBe(1);
    expect(result.projects[0]?.workforcePlan.expert?.name).toContain(
      'Unverified',
    );
    expect(result.projects[0]?.workforcePlan.execution_authorized).toBe(false);
    expect(fetcher).toHaveBeenCalledWith(
      'http://hasura.local/v1/graphql',
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: 'Bearer signed-access-token',
        }),
      }),
    );
    expect(fetcher.mock.calls[0]?.[0]).toBe(
      'http://fluxcore.local/v1/projects/read-authorization',
    );
    expect(fetcher.mock.calls[0]?.[1]?.method).toBe('GET');
    expect(JSON.stringify(fetcher.mock.calls[1]?.[1]?.body)).not.toContain(
      'tenant_id',
    );
  });

  it('does not call Hasura without a signed upstream token', async () => {
    const fetcher = vi.fn<typeof fetch>();
    await expect(
      listSharedEngineeringProjects(
        'http://hasura.local/v1/graphql',
        'http://fluxcore.local/authz',
        undefined,
        fetcher,
      ),
    ).resolves.toEqual({ status: 'unavailable', reason: 'missing_token' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('does not query Hasura when SpiceDB authorization is denied or unavailable', async () => {
    const denied = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 }),
      );
    const unavailable = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 503 }));

    await expect(
      listSharedEngineeringProjects(
        'http://hasura.local/v1/graphql',
        'http://fluxcore.local/authz',
        'token',
        denied,
      ),
    ).resolves.toEqual({
      status: 'unavailable',
      reason: 'authorization_denied',
    });
    await expect(
      listSharedEngineeringProjects(
        'http://hasura.local/v1/graphql',
        'http://fluxcore.local/authz',
        'token',
        unavailable,
      ),
    ).resolves.toEqual({
      status: 'unavailable',
      reason: 'authorization_unavailable',
    });
    expect(denied).toHaveBeenCalledTimes(1);
    expect(unavailable).toHaveBeenCalledTimes(1);
  });

  it('fails closed for malformed payloads, GraphQL errors and upstream failures', async () => {
    const invalid = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ authorized: true }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: { fluxcore_project_read_model: [{ id: 'partial' }] },
          }),
          { status: 200 },
        ),
      );
    const graphqlError = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ authorized: true }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ errors: [{ message: 'permission denied' }] }),
          { status: 200 },
        ),
      );
    const unavailable = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ authorized: true }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 503 }));

    await expect(
      listSharedEngineeringProjects(
        'http://hasura.local/v1/graphql',
        'http://fluxcore.local/authz',
        'token',
        invalid,
      ),
    ).resolves.toEqual({ status: 'unavailable', reason: 'invalid_response' });
    await expect(
      listSharedEngineeringProjects(
        'http://hasura.local/v1/graphql',
        'http://fluxcore.local/authz',
        'token',
        graphqlError,
      ),
    ).resolves.toEqual({ status: 'unavailable', reason: 'invalid_response' });
    await expect(
      listSharedEngineeringProjects(
        'http://hasura.local/v1/graphql',
        'http://fluxcore.local/authz',
        'token',
        unavailable,
      ),
    ).resolves.toEqual({ status: 'unavailable', reason: 'upstream_error' });
  });
});
