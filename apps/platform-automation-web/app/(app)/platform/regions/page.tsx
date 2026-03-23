import { DataTable, PageHeader } from '@bac/ui';

import { regionRows } from '@/features/data';

export default function RegionsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Regions"
        title="Regions and capacity"
        description="Review the regional estate through availability, workload density, and headroom before drilling into specific clusters."
      />
      <DataTable
        columns={[
          { header: 'Region', render: (row) => row.name },
          { header: 'Availability', render: (row) => row.availability },
          { header: 'Capacity', render: (row) => row.capacity },
          { header: 'Workloads', render: (row) => row.workloads },
        ]}
        rows={regionRows}
        title="Regional estate"
      />
    </div>
  );
}
