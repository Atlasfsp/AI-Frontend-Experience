import { describe, expect, it } from 'vitest';

import { executeMockGraphqlOperation, resolveGraphqlPermission } from './graphql-explorer';

describe('graphql explorer helpers', () => {
  it('routes schema introspection through query permissions', () => {
    expect(resolveGraphqlPermission('query SchemaIntrospection { __schema { queryType { name } } }')).toBe(
      'data_access:query',
    );
  });

  it('returns a workspace mock payload for workspace queries', () => {
    const result = executeMockGraphqlOperation(
      {
        query: 'query WorkspaceSummary($id: uuid!) { workspace_by_pk(id: $id) { id tenant_id } }',
        variables: { id: 'workspace-alpha' },
      },
      {
        tenantId: 'tenant-alpha',
        workspaceId: 'workspace-core',
      },
    );

    expect(result.errors).toBeUndefined();
    expect(result.data).toMatchObject({
      workspace_by_pk: {
        id: 'workspace-alpha',
        tenant_id: 'tenant-alpha',
      },
    });
  });
});
