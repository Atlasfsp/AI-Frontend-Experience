import { listAgents } from '@bac/api-clients';
import { DataTable, Drawer, Modal, PageHeader, StatGrid } from '@bac/ui';

import { AgentOperationsPanel } from '@/components/agent-operations-panel';
import { summarizeAgentMesh } from '@/features/agent-operations';
import { createFactoryRequestContext } from '@/features/request-context';
import { getServerSession } from '@/lib/session';

export default async function AgentsPage() {
  const session = await getServerSession();
  const rows = await listAgents(createFactoryRequestContext(session));
  const summary = summarizeAgentMesh(rows);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Software Factory"
        title="Agent mesh"
        description="Operational grid for model assignment, service role, live health, and direct control-center actions."
        actions={
          <>
            <Modal
              title="Rebalance model pool"
              description="Use the mesh view to decide whether capacity should shift toward planning, reviewing, or artifact generation."
              triggerLabel="Rebalance pool"
            >
              <div className="space-y-4 text-sm text-slate-300">
                <p>Healthy agents: {summary.healthy}</p>
                <p>Working agents: {summary.working}</p>
                <p>Idle agents: {summary.idle}</p>
                <p>Use the action center on the right to queue the specific operational move.</p>
              </div>
            </Modal>
            <Drawer
              title="Routing playbook"
              description="Keep routing changes deliberate so release-critical flows always have enough agent headroom."
              triggerLabel="Open routing playbook"
            >
              <div className="space-y-4 text-sm text-slate-300">
                <p>1. Protect reviewer capacity during release windows.</p>
                <p>2. Shift idle writer capacity into evidence or docs workloads before expanding planner depth.</p>
                <p>3. Drain agents only after confirming their queued work can be safely reassigned.</p>
              </div>
            </Drawer>
          </>
        }
      />
      <StatGrid
        items={[
          {
            label: 'Healthy agents',
            value: summary.healthy.toString(),
            description: 'Agents currently reporting healthy status and ready for production routing.',
            status: 'success',
          },
          {
            label: 'Working agents',
            value: summary.working.toString(),
            description: 'Agents actively serving build, review, or planning workloads.',
            status: 'warning',
          },
          {
            label: 'Idle agents',
            value: summary.idle.toString(),
            description: 'Available capacity that can be reassigned before new instances are scheduled.',
          },
          {
            label: 'Service roles',
            value: new Set(rows.map((row) => row.service)).size.toString(),
            description: 'Distinct agent roles visible in the current mesh registry.',
          },
        ]}
      />
      <DataTable
        columns={[
          { header: 'Agent', render: (row) => <span className="font-medium text-white">{row.id}</span> },
          { header: 'Service', render: (row) => row.service },
          { header: 'Model', render: (row) => row.model },
          { header: 'Status', render: (row) => row.status },
        ]}
        rows={rows}
        title="Agent registry"
        description="Use the registry for the global snapshot, then select an agent in the control center for operational actions."
      />
      <AgentOperationsPanel agents={rows} />
    </div>
  );
}
