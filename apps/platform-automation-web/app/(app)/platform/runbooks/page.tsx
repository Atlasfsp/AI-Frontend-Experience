import { DataTable, PageHeader } from '@bac/ui';

import { runbookRows } from '@/features/data';

export default function RunbooksPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Runbooks / Docs"
        title="Runbooks and platform docs"
        description="Operational guidance for failover, workspace onboarding, data access incidents, and the rest of the platform automation estate."
      />
      <DataTable
        columns={[
          { header: 'Runbook', render: (row) => row.title },
          { header: 'Audience', render: (row) => row.audience },
          { header: 'Route', render: (row) => row.route },
        ]}
        rows={runbookRows}
        title="Platform runbooks"
      />
    </div>
  );
}
