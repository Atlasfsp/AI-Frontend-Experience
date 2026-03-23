import { DataTable, PageHeader, TerminalPanel } from '@bac/ui';

import { quotaRows, quotaTerminalLines } from '@/features/data';

export default function QuotasPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Quota / Cost Dashboards"
        title="Quota and cost dashboards"
        description="Track workspace and platform quota posture, capacity trends, and cost signals before they turn into policy or reliability incidents."
      />
      <DataTable
        columns={[
          { header: 'Service', render: (row) => row.service },
          { header: 'Utilization', render: (row) => row.utilization },
          { header: 'Budget', render: (row) => row.budget },
          { header: 'Trend', render: (row) => row.trend },
        ]}
        rows={quotaRows}
        title="Capacity and spend"
      />
      <TerminalPanel lines={quotaTerminalLines} title="Quota drill-in" />
    </div>
  );
}
