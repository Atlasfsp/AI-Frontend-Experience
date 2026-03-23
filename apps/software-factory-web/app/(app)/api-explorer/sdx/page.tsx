import { DataTable, DocsCodePanel, PageHeader } from '@bac/ui';

const contractRows = [
  {
    id: 'work-items',
    contract: 'Work item lifecycle',
    consumer: 'Dashboard, PRD intake, activity timeline, and work-item review surfaces',
    owner: 'AI Software Factory services',
  },
  {
    id: 'builds',
    contract: 'Build and test status',
    consumer: 'Build dashboard, build detail, compliance evidence, and release manager',
    owner: 'Build orchestration',
  },
  {
    id: 'artifacts',
    contract: 'Release artifacts and evidence',
    consumer: 'Release manager, compliance terminal, and audit views',
    owner: 'Artifact governance',
  },
  {
    id: 'swagger',
    contract: 'Swagger / OpenAPI',
    consumer: 'Dedicated Swagger explorer and API contracts screens',
    owner: 'SDX gateway',
  },
] as const;

const routingSnippet = `// Browser -> BFF -> SDX gateway
GET  /api/proxy/sdx/software-factory/overview
GET  /api/proxy/sdx/software-factory/builds
GET  /api/proxy/sdx/swagger

// BFF expectations
- inject signed session context
- preserve tenant and workspace scope
- keep tokens out of browser JavaScript
- normalize upstream errors for the operator shell`;

export default function SdxApiExplorerDetailPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="API Explorer"
        title="SDX contract explorer"
        description="Contract guide for the Software Factory backend surfaces that power intake, builds, releases, and API exploration inside the web shell."
      />
      <DataTable
        title="SDX contract map"
        description="Use this view when you need to understand which backend surface a Software Factory screen should depend on."
        rows={contractRows.map((row) => ({ ...row }))}
        columns={[
          { header: 'Contract', render: (row) => row.contract },
          { header: 'Primary consumer', render: (row) => row.consumer },
          { header: 'Owner', render: (row) => row.owner },
        ]}
      />
      <DocsCodePanel
        title="Routing model"
        description="The SDX gateway should remain behind the shared BFF proxy so auth, tenancy, and observability stay aligned with the rest of the web platform."
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
              'Prefer the dedicated Swagger and API contracts routes for day-to-day exploration inside the Software Factory experience.\n\nAdd new backend surfaces to @bac/api-clients first, then wire route-level presentation with loading, empty, and error states.\n\nKeep tenant and workspace context explicit in request helpers so evidence and audit screens always render scoped data correctly.',
          },
        ]}
      />
    </div>
  );
}
