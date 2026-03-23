import { DataTable, DocsCodePanel, PageHeader } from '@bac/ui';

import { adrRows } from '@/features/data';

export default function AdrsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="ADR Viewer"
        title="Architecture decision records"
        description="Track accepted decisions that shape routing, generated clients, release evidence, and the web experience layer."
      />
      <DataTable
        columns={[
          { header: 'ADR', render: (row) => row.id },
          { header: 'Decision', render: (row) => row.decision },
          { header: 'Owner', render: (row) => row.owner },
          { header: 'Status', render: (row) => row.status },
          { header: 'Date', render: (row) => row.date },
        ]}
        rows={adrRows}
        title="Accepted decisions"
      />
      <DocsCodePanel
        tabs={[
          {
            content:
              'Every ADR links directly to the frontend route or shared component it affects.\n\nThat keeps the docs portal, operator shells, and generated-client seams aligned over time.',
            id: 'docs',
            label: 'Guidance',
          },
          {
            content:
              '# ADR template\n\n- Context\n- Decision\n- Consequences\n- Frontend impact\n- API/client impact',
            id: 'code',
            kind: 'code',
            label: 'Template',
          },
        ]}
        title="ADR operating pattern"
      />
    </div>
  );
}
