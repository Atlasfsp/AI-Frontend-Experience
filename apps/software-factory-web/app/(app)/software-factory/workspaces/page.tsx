import { DetailList, PageHeader, WorkspaceSwitcher } from '@bac/ui';

import { softwareFactoryWorkspaceOptions } from '@/features/data';

export default function WorkspacesPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Project and Workspace Selector"
        title="Project and workspace selector"
        description="Choose the active project lane, understand tenant ownership, and preview the workspace posture before opening build, contract, or release surfaces."
      />
      <WorkspaceSwitcher options={softwareFactoryWorkspaceOptions} />
      <DetailList
        description="The web experience is ready for a future shared-workspace service without changing the page contracts."
        items={[
          {
            hint: 'Mapped from the signed session and Authentik claims today.',
            label: 'Current scope',
            value: 'tenant-echo / workspace-core',
          },
          {
            hint: 'Designed to route through a shared selector service later.',
            label: 'Selection model',
            value: 'Session-aware with BFF routing',
          },
          {
            hint: 'Critical for generated clients, OpenAPI calls, and audit context.',
            label: 'Propagation',
            value: 'tenantId + workspaceId on all requests',
          },
          {
            hint: 'Supports mock mode and future live workspace lookup.',
            label: 'Data source',
            value: 'Mock-ready registry',
          },
        ]}
        title="Selector contract"
      />
    </div>
  );
}
