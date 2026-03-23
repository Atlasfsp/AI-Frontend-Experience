import { listWorkspaces } from '@bac/api-clients';
import { DataTable, Drawer, Modal, PageHeader, StatGrid } from '@bac/ui';

import { WorkspaceOperationsPanel } from '@/components/workspace-operations-panel';
import { createPlatformRequestContext } from '@/features/request-context';
import { summarizeWorkspaceEstate } from '@/features/workspace-operations';
import { getServerSession } from '@/lib/session';

export default async function WorkspacesPage() {
  const session = await getServerSession();
  const rows = await listWorkspaces(createPlatformRequestContext(session));
  const summary = summarizeWorkspaceEstate(rows);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace Estate"
        title="Tenant workspaces"
        description="Workspace inventory with operational controls for access reviews, deployment freezes, promise expansion, and estate triage."
        actions={
          <>
            <Modal
              title="Plan workspace action"
              description="Use the workspace estate to choose the right operational move before making a live platform change."
              triggerLabel="Plan action"
            >
              <div className="space-y-4 text-sm text-slate-300">
                <p>Total workspaces: {rows.length}</p>
                <p>Healthy workspaces: {summary.healthy}</p>
                <p>Warning workspaces: {summary.warning}</p>
                <p>The operational panel below lets you queue the next action per workspace.</p>
              </div>
            </Modal>
            <Drawer
              title="Workspace control guide"
              description="Operational guidance for deciding between access review, freeze, and promise expansion actions."
              triggerLabel="Open control guide"
            >
              <div className="space-y-4 text-sm text-slate-300">
                <p>Queue an access review when ownership, role changes, or release windows require tighter identity validation.</p>
                <p>Freeze deployments when DR drills, policy incidents, or quota pressure would make a rollout unsafe.</p>
                <p>Expand the promise set only after the tenant and quota posture show enough headroom for new capabilities.</p>
              </div>
            </Drawer>
          </>
        }
      />
      <StatGrid
        items={[
          {
            label: 'Workspace count',
            value: rows.length.toString(),
            description: 'Total workspaces currently visible to the control-plane operator.',
          },
          {
            label: 'Healthy workspaces',
            value: summary.healthy.toString(),
            description: 'Workspaces reporting healthy post-provisioning posture.',
            status: 'success',
          },
          {
            label: 'Warning workspaces',
            value: summary.warning.toString(),
            description: 'Workspaces needing attention for quota, promises, or deployment posture.',
            status: summary.warning > 0 ? 'warning' : 'success',
          },
          {
            label: 'Claimed promises',
            value: summary.promises.toString(),
            description: 'Current total promise count across the visible estate.',
          },
        ]}
      />
      <DataTable
        columns={[
          { header: 'Workspace', render: (row) => <span className="font-medium text-white">{row.id}</span> },
          { header: 'Tenant', render: (row) => row.tenant },
          { header: 'Promises', render: (row) => row.promiseCount },
          { header: 'Status', render: (row) => row.status },
        ]}
        description="This route complements the workspace factory page by showing the estate after provisioning."
        rows={rows}
        title="Workspace estate"
      />
      <WorkspaceOperationsPanel workspaces={rows} />
    </div>
  );
}
