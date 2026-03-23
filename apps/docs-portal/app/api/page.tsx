import { DataTable, DocsCodePanel, PageHeader } from '@bac/ui';

const apiRows = [
  {
    id: 'sdx-openapi',
    surface: 'SDX OpenAPI',
    location: 'packages/api-clients/src/swagger/client.ts',
    purpose: 'Feeds the software-factory Swagger explorer and contract-aware docs surfaces.',
  },
  {
    id: 'factory-domain',
    surface: 'Software Factory client seams',
    location: 'packages/api-clients/src/sdx/client.ts',
    purpose: 'Typed access to overview, builds, work items, and future release orchestration APIs.',
  },
  {
    id: 'platform-domain',
    surface: 'Platform control-plane seams',
    location: 'packages/api-clients/src/platform/client.ts',
    purpose: 'Typed access to regions, workspaces, promises, clusters, and control-plane dashboard data.',
  },
  {
    id: 'graphql',
    surface: 'GraphQL generation hooks',
    location: 'packages/api-clients/codegen/graphql-codegen.ts',
    purpose: 'Landing zone for Hasura-driven query and subscription generation once schemas are finalized.',
  },
] as const;

const codegenSnippet = `pnpm sync:openapi
pnpm sync:proto
pnpm --filter @bac/api-clients typecheck

# Next step when live schemas are available:
# pnpm graphql-codegen --config packages/api-clients/codegen/graphql-codegen.ts`;

export default function ApiPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="BAC Docs"
        title="API surfaces"
        description="Generated API clients are a first-class part of the frontend architecture. Apps consume them through request-context aware helpers instead of ad hoc networking."
      />
      <DataTable
        title="Integration surfaces"
        description="These seams keep API adoption consistent across the operator apps and make code generation an implementation detail rather than a page concern."
        rows={apiRows.map((row) => ({ ...row }))}
        columns={[
          { header: 'Surface', render: (row) => row.surface },
          { header: 'Location', render: (row) => row.location },
          { header: 'Purpose', render: (row) => row.purpose },
        ]}
      />

      <DocsCodePanel
        title="Contract sync workflow"
        description="The frontend treats Swagger, protobuf, and GraphQL artifacts as syncable inputs. Product apps then consume stable helpers from shared packages."
        tabs={[
          {
            id: 'commands',
            label: 'Sync commands',
            kind: 'code',
            content: codegenSnippet,
          },
          {
            id: 'notes',
            label: 'Guidance',
            content:
              'Keep contract downloads and code generation in scripts so CI and local development follow the same path.\n\nExpose route-specific loading and error states in the apps, but centralize network and schema handling in shared packages.\n\nUse BFF routes whenever browser access needs additional auth, tenancy, or policy enforcement.',
          },
        ]}
      />
    </div>
  );
}
