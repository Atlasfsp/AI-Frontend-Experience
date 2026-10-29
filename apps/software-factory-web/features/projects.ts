export type PersistedStaffingProposal = {
  projectVersion: number;
  team: {
    teamId: string;
    budgetCeilingUsd: number;
    createdAt: string;
    status: string;
    members: Array<{ roleId: string; title: string; seniority: string }>;
  };
};

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
    team_proposals?: PersistedStaffingProposal[];
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function parsePersistedStaffingProposals(
  value: unknown,
): PersistedStaffingProposal[] | null {
  if (!Array.isArray(value)) return null;
  const proposals = value.map((item): PersistedStaffingProposal | null => {
    if (
      !isRecord(item) ||
      !Number.isInteger(item.project_version) ||
      (item.project_version as number) <= 0 ||
      !isRecord(item.team)
    )
      return null;
    const team = item.team;
    if (
      typeof team.team_id !== 'string' ||
      team.team_id.trim().length === 0 ||
      typeof team.budget_ceiling_usd !== 'number' ||
      !Number.isFinite(team.budget_ceiling_usd) ||
      team.budget_ceiling_usd <= 0 ||
      typeof team.created_at !== 'string' ||
      Number.isNaN(Date.parse(team.created_at)) ||
      typeof team.status !== 'string' ||
      !Array.isArray(team.members)
    )
      return null;
    const members = team.members.map(
      (member): { roleId: string; title: string; seniority: string } | null => {
        if (
          !isRecord(member) ||
          typeof member.role_id !== 'string' ||
          member.role_id.trim().length === 0 ||
          typeof member.title !== 'string' ||
          member.title.trim().length === 0 ||
          typeof member.seniority !== 'string' ||
          member.seniority.trim().length === 0
        )
          return null;
        return {
          roleId: member.role_id,
          title: member.title,
          seniority: member.seniority,
        };
      },
    );
    if (members.some((member) => member === null)) return null;
    return {
      projectVersion: item.project_version as number,
      team: {
        teamId: team.team_id,
        budgetCeilingUsd: team.budget_ceiling_usd,
        createdAt: team.created_at,
        status: team.status,
        members: members as PersistedStaffingProposal['team']['members'],
      },
    };
  });
  return proposals.some((proposal) => proposal === null)
    ? null
    : (proposals as PersistedStaffingProposal[]);
}

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
        const workforcePlan = row.workforce_plan_json;
        const parsedTeamProposals =
          isRecord(workforcePlan) && 'team_proposals' in workforcePlan
            ? parsePersistedStaffingProposals(workforcePlan.team_proposals)
            : undefined;
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
          Array.isArray(row.workforce_plan_json) ||
          parsedTeamProposals === null
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
          workforcePlan: {
            ...(workforcePlan as SharedEngineeringProject['workforcePlan']),
            ...(parsedTeamProposals === undefined
              ? {}
              : { team_proposals: parsedTeamProposals }),
          },
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
