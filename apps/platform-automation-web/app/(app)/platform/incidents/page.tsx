import { DataTable, PageHeader, Timeline } from '@bac/ui';

import { incidentRows, observabilityTimeline } from '@/features/data';

export default function IncidentsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Incident / DR Center"
        title="Incident and disaster recovery center"
        description="Coordinate incident response, recovery plans, and disaster recovery rehearsal status across the platform estate."
      />
      <Timeline items={observabilityTimeline} title="Signals and recovery events" />
      <DataTable
        columns={[
          { header: 'Summary', render: (row) => row.summary },
          { header: 'Severity', render: (row) => row.severity },
          { header: 'Owner', render: (row) => row.owner },
          { header: 'Recovery', render: (row) => row.recovery },
        ]}
        rows={incidentRows}
        title="Open incidents"
      />
    </div>
  );
}
