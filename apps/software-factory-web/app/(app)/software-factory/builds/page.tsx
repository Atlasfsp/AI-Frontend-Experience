import { listBuilds } from '@bac/api-clients';
import { DataTable, PageHeader } from '@bac/ui';
import Link from 'next/link';

import { getServerSession } from '@/lib/session';

export default async function BuildsPage() {
  const session = await getServerSession();
  const rows = await listBuilds({
    accessToken: session?.accessToken,
    tenantId: session?.tenantId,
    workspaceId: session?.workspaceId,
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Software Factory"
        title="Build operations"
        description="Pipeline list scaffold with direct links into build-level diagnostics."
      />
      <DataTable
        columns={[
          {
            header: 'Build',
            render: (row) => (
              <Link className="font-medium text-white underline decoration-cyan-300/40 underline-offset-4" href={`/software-factory/builds/${row.id}`}>
                {row.name}
              </Link>
            ),
          },
          { header: 'Stage', render: (row) => row.stage },
          { header: 'Status', render: (row) => row.status },
          { header: 'Updated', render: (row) => row.updatedAt },
        ]}
        rows={rows}
        title="Build history"
      />
    </div>
  );
}
