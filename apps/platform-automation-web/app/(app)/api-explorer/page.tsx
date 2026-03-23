import Link from 'next/link';

import { DataTable, DetailList, PageHeader } from '@bac/ui';

const explorerRows = [
  {
    id: 'hasura-bff',
    surface: 'Hasura BFF route',
    path: '/api/proxy/hasura',
    purpose: 'Session-aware GraphQL querying and subscription preparation with tenancy and policy checks applied upstream.',
  },
  {
    id: 'sdx-bff',
    surface: 'SDX BFF route',
    path: '/api/proxy/sdx',
    purpose: 'Normalized access to platform automation and shared product surfaces that require auth and tracing context.',
  },
  {
    id: 'contract-guides',
    surface: 'Platform contract guide',
    path: '/api-explorer/platform',
    purpose: 'Operator-facing inventory of control-plane contracts, consumers, and adoption expectations.',
  },
] as const;

export default function PlatformApiExplorerPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Explorer"
        title="Platform API explorer"
        description="The platform explorer is organized around BFF boundaries so cluster, workspace, and policy-sensitive access stays consistent across the control plane."
      />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DataTable
          title="Explorer surfaces"
          description="These entry points keep browser access behind policy-aware boundaries while leaving room for richer interactive tooling later."
          rows={explorerRows.map((row) => ({ ...row }))}
          columns={[
            { header: 'Surface', render: (row) => row.surface },
            { header: 'Path', render: (row) => row.path },
            { header: 'Purpose', render: (row) => row.purpose },
          ]}
        />
        <DetailList
          title="Explorer principles"
          items={[
            {
              label: 'Policy before convenience',
              value: 'Requests that need tenancy, Authentik JWTs, or SpiceDB checks should land on BFF routes first rather than exposing raw upstream endpoints.',
            },
            {
              label: 'Operational context',
              value: 'Platform operators need explorer surfaces that explain where a contract sits in the larger control-plane workflow, not just raw endpoint text.',
            },
            {
              label: 'Next step',
              value: 'Use the deeper contract guide for per-surface ownership and integration notes.',
            },
          ]}
        />
      </div>
      <Link
        href="/api-explorer/platform"
        className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
      >
        Open platform contract guide
      </Link>
    </div>
  );
}
