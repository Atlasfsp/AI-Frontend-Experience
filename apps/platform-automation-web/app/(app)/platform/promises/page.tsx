import { listPromises } from '@bac/api-clients';
import { DataTable, PageHeader } from '@bac/ui';

import { createPlatformRequestContext } from '@/features/request-context';
import { getServerSession } from '@/lib/session';

export default async function PromisesPage() {
  const session = await getServerSession();
  const rows = await listPromises(createPlatformRequestContext(session));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Promise Catalog"
        title="Promise catalog"
        description="Governed platform capability catalog aligned to BAC promises and future claim-backed forms."
      />
      <DataTable
        columns={[
          { header: 'Capability', render: (row) => <span className="font-medium text-white">{row.title}</span> },
          { header: 'Owner', render: (row) => row.owner },
          { header: 'Status', render: (row) => row.status },
          { header: 'Resource', render: (row) => row.id },
        ]}
        description="Promises stay visible as operator-facing products, not just hidden platform plumbing."
        rows={rows}
        title="Governed promises"
      />
    </div>
  );
}
