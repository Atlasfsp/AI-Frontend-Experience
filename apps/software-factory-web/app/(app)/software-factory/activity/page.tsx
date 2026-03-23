import { DataTable, PageHeader, Timeline } from '@bac/ui';

import { auditRows, softwareFactoryTimeline } from '@/features/data';

export default function ActivityPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Activity Timeline"
        title="Activity timeline"
        description="Unified timeline for build activity, release events, policy changes, and operator actions across the software-factory experience."
      />
      <Timeline items={softwareFactoryTimeline} title="Cross-system activity" />
      <DataTable
        columns={[
          { header: 'Timestamp', render: (row) => row.timestamp },
          { header: 'Actor', render: (row) => row.actor },
          { header: 'Action', render: (row) => row.action },
          { header: 'Target', render: (row) => row.target },
        ]}
        rows={auditRows}
        title="Recent audit-linked events"
      />
    </div>
  );
}
