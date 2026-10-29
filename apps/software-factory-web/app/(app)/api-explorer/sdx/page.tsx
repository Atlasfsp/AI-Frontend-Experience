import React from 'react';

import { DataTable, DocsCodePanel, PageHeader } from '@bac/ui';

const contractRows = [
  {
    id: 'projects',
    contract: 'Shared project and SME staffing',
    consumer: 'Create intake, Engineer workspaces, and proposed team review',
    owner: 'FluxCore project and workforce API',
  },
  {
    id: 'orchestration',
    contract: 'Routing, plans, SDLC execution, and run reads',
    consumer: 'Governed engineering operations and execution history',
    owner: 'FluxCore orchestrator API',
  },
  {
    id: 'governance',
    contract: 'Governance, evidence, release promotion, and evaluation',
    consumer: 'Restricted control-plane operations and audit views',
    owner: 'FluxCore policy and release APIs',
  },
  {
    id: 'integrations',
    contract: 'Activation, frontend providers, and workforce routing',
    consumer: 'Project setup and platform integration surfaces',
    owner: 'FluxCore integration APIs',
  },
] as const;

const routingSnippet = `// Browser -> BFF -> canonical FluxCore API
POST /api/proxy/sdx/v1/projects
POST /api/proxy/sdx/v1/workforce/org/staff
POST /api/proxy/sdx/v1/sdlc/execute
GET  /api/proxy/sdx/v1/runs/{runId}
GET  /api/proxy/sdx/v1/evidence/bundles/{bundleId}

// BFF expectations
- explicit method/path allowlist with operation-specific role checks
- never forward browser cookies or caller-supplied tenant headers
- authenticate with the session token; never fabricate a production bearer
- backend remains responsible for tenant/resource authorization`;

export default function SdxApiExplorerDetailPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="API Explorer"
        title="FluxCore API coverage"
        description="Verified local backend routes and their intended frontend consumers. Unimplemented read models are called out instead of being implied by legacy examples."
      />
      <DataTable
        title="Canonical backend surfaces"
        description="Every user-facing operation must use the authenticated BFF and the backend tenant/resource authorization check."
        rows={contractRows.map((row) => ({ ...row }))}
        columns={[
          { header: 'Contract', render: (row) => row.contract },
          { header: 'Primary consumer', render: (row) => row.consumer },
          { header: 'Owner', render: (row) => row.owner },
        ]}
      />
      <section role="status" className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.05] p-5">
        <h2 className="font-semibold text-amber-100">Frontend coverage gaps</h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">
          The dashboard/build clients still request <code>/api/dashboard/overview</code>, <code>/api/work-items</code>, <code>/api/builds</code>, and <code>/api/agents</code>. These paths are not registered by the Go API. Live reports for those surfaces remain unavailable; demo records are separately labelled.
        </p>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">
          Repository connections, server-persisted iterations, provider-backed diffs/reviews, and deployment receipts also need durable backend APIs before those workflows can be called live.
        </p>
      </section>
      <DocsCodePanel
        title="Routing model"
        description="The BFF constrains each browser operation; FluxCore still decides tenant scope and resource authorization."
        tabs={[
          { id: 'routing', label: 'BFF routing', kind: 'code', content: routingSnippet },
          {
            id: 'guidance',
            label: 'Implementation rules',
            content:
              'Add each operation to the BFF allowlist with a least-privilege BAC permission and a backend SpiceDB action. Add a typed API client, loading/empty/error UI, and an integration test that asserts tenant isolation.\n\nDo not expose a route just because it is registered: handlers returning NOT_CONNECTED or NOT_PERSISTED must be presented as unavailable, and must not be described as completed work.',
          },
        ]}
      />
    </div>
  );
}
