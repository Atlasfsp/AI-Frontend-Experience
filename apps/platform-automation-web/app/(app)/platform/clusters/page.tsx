import { listClusters } from '@bac/api-clients';
import { DataTable, PageHeader } from '@bac/ui';

import { createPlatformRequestContext } from '@/features/request-context';
import { getServerSession } from '@/lib/session';

export default async function ClustersPage() {
  const session = await getServerSession();
  const rows = await listClusters(createPlatformRequestContext(session));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Regions and Clusters"
        title="Regional clusters"
        description="Regional cluster inventory with health, workload summaries, and direct context for GitOps and quota review."
      />
      <DataTable
        columns={[
          { header: 'Cluster', render: (row) => <span className="font-medium text-white">{row.id}</span> },
          { header: 'Region', render: (row) => row.region },
          { header: 'Status', render: (row) => row.status },
          { header: 'Workloads', render: (row) => row.workloadCount },
        ]}
        description="Clusters stay as first-class platform resources, not hidden implementation details."
        rows={rows}
        title="Cluster inventory"
      />
    </div>
  );
}
