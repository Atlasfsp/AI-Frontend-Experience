import { listWorkItems } from '@bac/api-clients';
import { DataTable, PageHeader } from '@bac/ui';

import { getServerSession } from '@/lib/session';

export default async function WorkItemsPage() {
  const session = await getServerSession();
  const rows = await listWorkItems({
    accessToken: session?.accessToken,
    tenantId: session?.tenantId,
    workspaceId: session?.workspaceId,
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Software Factory"
        title="Work item intake"
        description="Filterable requirement and execution intake scaffold with a clean path to live submission flows."
      />
      <DataTable
        columns={[
          { header: 'Title', render: (row) => <span className="font-medium text-white">{row.title}</span> },
          { header: 'Owner', render: (row) => row.owner },
          { header: 'Priority', render: (row) => row.priority },
          { header: 'Status', render: (row) => row.status },
          { header: 'Updated', render: (row) => row.updatedAt },
        ]}
        rows={rows}
        title="Work item queue"
      />
    </div>
  );
}
