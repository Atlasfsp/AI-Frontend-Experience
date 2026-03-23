import type { BacSession } from '@bac/auth';

export interface GraphqlPreset {
  description: string;
  id: string;
  label: string;
  operationName: string;
  query: string;
  tags: string[];
  variables: string;
}

export const graphqlPresets: GraphqlPreset[] = [
  {
    id: 'workspace-summary',
    label: 'Workspace summary',
    description: 'Inspect one workspace, its tenant scope, and promise posture through the operator-safe explorer.',
    operationName: 'WorkspaceSummary',
    query: `query WorkspaceSummary($id: uuid!) {
  workspace_by_pk(id: $id) {
    id
    status
    tenant_id
    promise_count
    last_deployment_at
  }
}`,
    variables: JSON.stringify({ id: 'workspace-core' }, null, 2),
    tags: ['workspace', 'tenant', 'inventory'],
  },
  {
    id: 'regional-clusters',
    label: 'Regional clusters',
    description: 'Compare cluster readiness, region placement, and workload pressure before GitOps actions.',
    operationName: 'RegionalClusters',
    query: `query RegionalClusters {
  clusters(limit: 5, order_by: { region: asc }) {
    id
    region
    status
    workload_count
  }
}`,
    variables: JSON.stringify({}, null, 2),
    tags: ['clusters', 'regions', 'capacity'],
  },
  {
    id: 'quota-hotspots',
    label: 'Quota hotspots',
    description: 'Review which workspaces are closest to quota or cost review thresholds.',
    operationName: 'QuotaHotspots',
    query: `query QuotaHotspots {
  workspace_quota_hotspots(limit: 10) {
    workspace_id
    cpu_reserved
    memory_reserved
    budget_status
  }
}`,
    variables: JSON.stringify({}, null, 2),
    tags: ['quotas', 'cost', 'capacity'],
  },
  {
    id: 'schema-introspection',
    label: 'Schema introspection',
    description: 'Read the top-level Hasura query fields available to this workspace-scoped explorer session.',
    operationName: 'SchemaIntrospection',
    query: `query SchemaIntrospection {
  __schema {
    queryType {
      name
    }
    types {
      name
      kind
    }
  }
}`,
    variables: JSON.stringify({}, null, 2),
    tags: ['schema', 'introspection', 'graphql'],
  },
];

export interface GraphqlExecutionPayload {
  operationName?: string;
  query: string;
  variables?: unknown;
}

export interface MockGraphqlResult {
  data?: unknown;
  errors?: Array<{ message: string }>;
  meta: {
    source: 'mock';
    tenantId: string;
    workspaceId: string;
  };
}

export function resolveGraphqlPermission(query: string) {
  const normalized = query.trim().toLowerCase();

  if (normalized.startsWith('mutation')) {
    return 'data_access:mutate' as const;
  }

  if (normalized.startsWith('subscription')) {
    return 'data_access:subscribe' as const;
  }

  return 'data_access:query' as const;
}

export function executeMockGraphqlOperation(
  payload: GraphqlExecutionPayload,
  session: Pick<BacSession, 'tenantId' | 'workspaceId'>,
): MockGraphqlResult {
  const query = payload.query.toLowerCase();

  if (query.includes('mutation')) {
    return {
      errors: [
        {
          message:
            'Mutation execution is disabled in mock mode. Use the dedicated control-center flows to stage operational changes.',
        },
      ],
      meta: {
        source: 'mock',
        tenantId: session.tenantId,
        workspaceId: session.workspaceId,
      },
    };
  }

  if (query.includes('__schema')) {
    return {
      data: {
        __schema: {
          queryType: {
            name: 'query_root',
          },
          types: [
            { kind: 'OBJECT', name: 'workspace' },
            { kind: 'OBJECT', name: 'cluster' },
            { kind: 'OBJECT', name: 'workspace_quota_hotspots' },
          ],
        },
      },
      meta: {
        source: 'mock',
        tenantId: session.tenantId,
        workspaceId: session.workspaceId,
      },
    };
  }

  if (query.includes('workspace_quota_hotspots')) {
    return {
      data: {
        workspace_quota_hotspots: [
          {
            workspace_id: 'workspace-core',
            cpu_reserved: '78%',
            memory_reserved: '81%',
            budget_status: 'watch',
          },
          {
            workspace_id: 'workspace-regional-staging',
            cpu_reserved: '61%',
            memory_reserved: '65%',
            budget_status: 'healthy',
          },
        ],
      },
      meta: {
        source: 'mock',
        tenantId: session.tenantId,
        workspaceId: session.workspaceId,
      },
    };
  }

  if (query.includes('clusters')) {
    return {
      data: {
        clusters: [
          { id: 'ng-prod', region: 'Nigeria', status: 'healthy', workload_count: 114 },
          { id: 'za-prod', region: 'South Africa', status: 'healthy', workload_count: 96 },
          { id: 'eu-prod', region: 'Europe', status: 'warning', workload_count: 122 },
        ],
      },
      meta: {
        source: 'mock',
        tenantId: session.tenantId,
        workspaceId: session.workspaceId,
      },
    };
  }

  return {
    data: {
      workspace_by_pk: {
        id:
          typeof payload.variables === 'object' &&
          payload.variables !== null &&
          'id' in payload.variables &&
          typeof payload.variables.id === 'string'
            ? payload.variables.id
            : session.workspaceId,
        status: 'healthy',
        tenant_id: session.tenantId,
        promise_count: 8,
        last_deployment_at: '2026-03-22T09:12:00.000Z',
      },
    },
    meta: {
      source: 'mock',
      tenantId: session.tenantId,
      workspaceId: session.workspaceId,
    },
  };
}
