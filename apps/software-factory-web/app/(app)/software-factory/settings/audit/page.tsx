import { DataTable, PageHeader, TerminalPanel } from '@bac/ui';

import { auditRows } from '@/features/data';

export default function AuditSettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Audit View"
        title="Audit and trace view"
        description="Review who changed what, which surface they used, and how those actions connect back to builds, contracts, and release decisions."
      />
      <DataTable
        columns={[
          { header: 'Timestamp', render: (row) => row.timestamp },
          { header: 'Actor', render: (row) => row.actor },
          { header: 'Action', render: (row) => row.action },
          { header: 'Target', render: (row) => row.target },
        ]}
        rows={auditRows}
        title="Recent audit events"
      />
      <TerminalPanel
        lines={[
          '$ bac audit tail --scope software-factory --format compact',
          '09:18 release approval recorded -> release-1042',
          '09:08 swagger explorer opened -> sdx-openapi',
          '08:55 prd updated -> wi-204',
        ]}
        title="Audit tail"
      />
    </div>
  );
}
