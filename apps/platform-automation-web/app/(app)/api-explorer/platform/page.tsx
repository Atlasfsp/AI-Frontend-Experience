import { DataTable, DocsCodePanel, PageHeader } from '@bac/ui';

const contractRows = [
  {
    id: 'workspace-graphql',
    contract: 'Workspace GraphQL',
    consumer: 'Workspace factory, quotas, and identity surfaces',
    owner: 'Hasura + Platform Automation',
  },
  {
    id: 'cluster-ops',
    contract: 'Cluster operations',
    consumer: 'Regions, clusters, incidents, and DR views',
    owner: 'Platform control plane',
  },
  {
    id: 'promise-catalog',
    contract: 'Promise catalog',
    consumer: 'Promise catalog and workspace provisioning experiences',
    owner: 'Platform product services',
  },
  {
    id: 'gitops-rollouts',
    contract: 'GitOps rollout status',
    consumer: 'GitOps convergence and release visibility surfaces',
    owner: 'Fleet / GitOps automation',
  },
] as const;

const routingSnippet = `// Browser -> BFF -> upstream
GET  /api/proxy/sdx/platform/overview
POST /api/proxy/hasura
GET  /api/proxy/sdx/platform/clusters

// BFF responsibilities
- attach signed session context
- inject access tokens
- enforce tenant and workspace scope
- normalize upstream errors for the shell`;

export default function PlatformApiExplorerDetailPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="API Explorer"
        title="Platform contract explorer"
        description="Contract guide for the control plane: where each surface belongs, who owns it, and how browser access should route through the shared web foundation."
      />
      <DataTable
        title="Platform contract map"
        rows={contractRows.map((row) => ({ ...row }))}
        columns={[
          { header: 'Contract', render: (row) => row.contract },
          { header: 'Primary consumer', render: (row) => row.consumer },
          { header: 'Owner', render: (row) => row.owner },
        ]}
      />
      <DocsCodePanel
        title="Routing model"
        description="Control-plane contracts are intended to stay behind shared BFF boundaries so auth, tenancy, policy, and observability stay coherent."
        tabs={[
          {
            id: 'routing',
            label: 'BFF routing',
            kind: 'code',
            content: routingSnippet,
          },
          {
            id: 'guidance',
            label: 'Guidance',
            content:
              'Add new platform contracts in shared client packages before wiring route-specific UI.\n\nKeep interactive exploration policy-aware: operators should see safe, curated views rather than raw ungoverned upstream access.\n\nWhen a contract serves both product apps, prefer a shared package seam over duplicate app-local implementations.',
          },
        ]}
      />
    </div>
  );
}
