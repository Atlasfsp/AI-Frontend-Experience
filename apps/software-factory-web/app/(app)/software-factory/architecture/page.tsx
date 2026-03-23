import { DataTable, DetailList, Drawer, MiniBarChart, PageHeader } from '@bac/ui';

import { architectureStreams } from '@/features/data';

const architectureRows = [
  {
    boundary: 'Intake and planning',
    id: 'intake',
    services: 'PRD intake, ADR service, project registry',
    summary: 'Owns requirement capture and architecture intent before build orchestration begins.',
  },
  {
    boundary: 'Execution mesh',
    id: 'execution',
    services: 'Planner, writer, reviewer, release manager',
    summary: 'Moves work through the AI Software Factory execution lifecycle.',
  },
  {
    boundary: 'Contract surface',
    id: 'contracts',
    services: 'Swagger explorer, generated clients, BFF proxies',
    summary: 'Keeps browser traffic policy-aware while exposing first-class contract tooling.',
  },
];

export default function ArchitecturePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Architecture Viewer"
        title="Architecture viewer"
        description="Review system boundaries, service responsibilities, and the operator-visible seams that connect PRDs, domain models, API contracts, builds, and releases."
        actions={
          <Drawer
            description="BFF routing is central to the frontend foundation because it protects credentials and centralizes policy enforcement."
            title="BFF and architecture seam"
            triggerLabel="Inspect BFF role"
          >
            <DetailList
              items={[
                {
                  hint: 'Routes generated SDK calls through auth-aware Next handlers.',
                  label: 'Request mediation',
                  value: 'Session-aware proxy layer',
                },
                {
                  hint: 'Prevents direct browser access to SDX and Hasura credentials.',
                  label: 'Security boundary',
                  value: 'Token isolation',
                },
                {
                  hint: 'Provides a stable place to add audit and observability hooks.',
                  label: 'Operational control',
                  value: 'Tracing + policy injection',
                },
              ]}
              title="BFF responsibilities"
            />
          </Drawer>
        }
      />
      <MiniBarChart items={architectureStreams} />
      <DataTable
        columns={[
          { header: 'Boundary', render: (row) => row.boundary },
          { header: 'Services', render: (row) => row.services },
          { header: 'Summary', render: (row) => row.summary },
        ]}
        description="Boundaries are laid out for long-term growth instead of binding pages directly to backend topology."
        rows={architectureRows}
        title="System boundaries"
      />
    </div>
  );
}
