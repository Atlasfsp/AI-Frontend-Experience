import { DataTable, DetailList, PageHeader } from '@bac/ui';

import { workspaceFactoryRows } from '@/features/data';

export default function WorkspaceFactoryPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Tenant / Workspace Factory"
        title="Tenant and workspace factory"
        description="Provision governed workspaces with the right service class, policy envelope, promise profile, and regional claims."
      />
      <DataTable
        columns={[
          { header: 'Workspace', render: (row) => row.workspace },
          { header: 'Requested by', render: (row) => row.requestedBy },
          { header: 'Service class', render: (row) => row.serviceClass },
          { header: 'Stage', render: (row) => row.stage },
        ]}
        rows={workspaceFactoryRows}
        title="Provisioning queue"
      />
      <DetailList
        items={[
          {
            hint: 'Provisioning is modeled as a durable flow, not a one-shot form submit.',
            label: 'Factory model',
            value: 'Queued requests with policy checkpoints',
          },
          {
            hint: 'Prepared for claim-backed promise installation and quota defaults.',
            label: 'Downstream outputs',
            value: 'Workspace, data access, observability, GitOps lanes',
          },
        ]}
        title="Provisioning posture"
      />
    </div>
  );
}
