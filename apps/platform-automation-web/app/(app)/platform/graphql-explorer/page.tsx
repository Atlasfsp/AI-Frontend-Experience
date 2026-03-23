import { DetailList, PageHeader, StatGrid } from '@bac/ui';

import { GraphqlExplorerConsole } from '@/components/graphql-explorer-console';
import { loadAppEnv } from '@/lib/env';
import { getServerSession } from '@/lib/session';

export default async function GraphqlExplorerPage() {
  const session = await getServerSession();
  const env = loadAppEnv();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Explorer"
        title="Hasura GraphQL explorer"
        description="Operator-safe GraphQL workspace with interactive execution, curated saved operations, and workspace-scoped request handling."
      />

      <StatGrid
        items={[
          {
            label: 'Execution mode',
            value: env.enableMockApi ? 'Mock' : 'Live',
            description: 'Mock mode returns deterministic sample payloads. Live mode executes against the authenticated Hasura endpoint.',
            status: env.enableMockApi ? 'warning' : 'success',
          },
          {
            label: 'Workspace',
            value: session?.workspaceId ?? 'workspace-core',
            description: 'The explorer inherits workspace scope from the signed session cookie.',
          },
          {
            label: 'Tenant',
            value: session?.tenantId ?? 'tenant-echo',
            description: 'Tenant context is preserved for every explorer request.',
          },
          {
            label: 'Guardrail',
            value: 'Policy enforced',
            description: 'Query, mutation, and subscription permissions are derived from the GraphQL document before execution.',
            status: 'success',
          },
        ]}
      />

      <DetailList
        title="Connection profile"
        items={[
          { label: 'Schema endpoint', value: env.hasuraUrl, monospace: true },
          { label: 'Transport', value: 'HTTPS via dedicated GraphQL explorer route' },
          { label: 'Auth context', value: 'Authentik JWT + tenant and workspace headers' },
          { label: 'Default permission', value: 'Query and schema-read, with mutation/subscription checks derived from the document' },
        ]}
      />

      <GraphqlExplorerConsole enableMockApi={env.enableMockApi} />
    </div>
  );
}
