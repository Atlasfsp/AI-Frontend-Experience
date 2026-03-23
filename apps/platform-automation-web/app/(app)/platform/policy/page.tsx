import { DataTable, PageHeader } from '@bac/ui';

import { policyRows } from '@/features/data';

export default function PolicyPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Policy / Compliance Center"
        title="Policy and compliance center"
        description="Track platform control posture, policy findings, and the review workflow for workspace factory and data access exceptions."
      />
      <DataTable
        columns={[
          { header: 'Control', render: (row) => row.control },
          { header: 'Owner', render: (row) => row.owner },
          { header: 'Severity', render: (row) => row.severity },
          { header: 'Status', render: (row) => row.status },
        ]}
        rows={policyRows}
        title="Policy findings"
      />
    </div>
  );
}
