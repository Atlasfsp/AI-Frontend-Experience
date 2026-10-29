export type SharedEngineeringProject = {
  id: string;
  name: string;
  outcome: string;
  applicationDomain: string;
  repositoryRef: string;
  status: string;
  updatedAt: string;
  version: number;
  workforcePlan: {
    status?: string;
    evidence_status?: string;
    execution_authorized?: boolean;
    roles?: unknown[];
    expert?: { name?: string; domain?: string };
  };
};

type ProjectListResult =
  | { status: 'available'; projects: SharedEngineeringProject[] }
  | {
      status: 'unavailable';
      reason:
        | 'missing_token'
        | 'authorization_denied'
        | 'authorization_unavailable'
        | 'upstream_error'
        | 'invalid_response';
    };

const PROJECTS_QUERY = `query FluxCoreProjects {
  fluxcore_project_read_model(order_by: {updated_at: desc}, limit: 100) {
    id
    name
    outcome
    application_domain
    repository_ref
    status
    version
    updated_at
    workforce_plan_json
  }
}`;

export async function listSharedEngineeringProjects(
  endpoint: string,
  authorizationEndpoint: string,
  accessToken: string | undefined,
  fetcher: typeof fetch = fetch,
): Promise<ProjectListResult> {
  if (!accessToken) return { status: 'unavailable', reason: 'missing_token' };

  try {
    const authorization = await fetcher(authorizationEndpoint, {
      method: 'GET',
      cache: 'no-store',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    if (authorization.status === 401 || authorization.status === 403) {
      return { status: 'unavailable', reason: 'authorization_denied' };
    }
    if (!authorization.ok)
      return { status: 'unavailable', reason: 'authorization_unavailable' };
    const decision = (await authorization.json()) as { authorized?: unknown };
    if (decision.authorized !== true)
      return { status: 'unavailable', reason: 'authorization_denied' };

    const response = await fetcher(endpoint, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: PROJECTS_QUERY }),
    });
    if (!response.ok)
      return { status: 'unavailable', reason: 'upstream_error' };
    const payload = (await response.json()) as {
      data?: { fluxcore_project_read_model?: unknown };
      errors?: unknown[];
    };
    if (
      payload.errors?.length ||
      !Array.isArray(payload.data?.fluxcore_project_read_model)
    ) {
      return { status: 'unavailable', reason: 'invalid_response' };
    }

    const projects = payload.data.fluxcore_project_read_model.map(
      (value): SharedEngineeringProject | null => {
        if (!value || typeof value !== 'object') return null;
        const row = value as Record<string, unknown>;
        if (
          typeof row.id !== 'string' ||
          typeof row.name !== 'string' ||
          typeof row.outcome !== 'string' ||
          typeof row.application_domain !== 'string' ||
          typeof row.repository_ref !== 'string' ||
          typeof row.status !== 'string' ||
          typeof row.version !== 'number' ||
          !Number.isInteger(row.version) ||
          row.version <= 0 ||
          typeof row.updated_at !== 'string' ||
          !row.workforce_plan_json ||
          typeof row.workforce_plan_json !== 'object' ||
          Array.isArray(row.workforce_plan_json)
        )
          return null;
        return {
          id: row.id,
          name: row.name,
          outcome: row.outcome,
          applicationDomain: row.application_domain,
          repositoryRef: row.repository_ref,
          status: row.status,
          version: row.version,
          updatedAt: row.updated_at,
          workforcePlan:
            row.workforce_plan_json as SharedEngineeringProject['workforcePlan'],
        };
      },
    );
    if (projects.some((project) => project === null))
      return { status: 'unavailable', reason: 'invalid_response' };
    return {
      status: 'available',
      projects: projects as SharedEngineeringProject[],
    };
  } catch {
    return { status: 'unavailable', reason: 'upstream_error' };
  }
}
