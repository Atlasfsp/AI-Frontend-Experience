import { DataTable, DetailList, PageHeader } from '@bac/ui';

const referenceRows = [
  {
    id: 'swagger',
    interface: 'Swagger/OpenAPI explorer',
    app: 'software-factory-web',
    route: '/software-factory/swagger',
    notes: 'First-class endpoint inventory and schema inspection experience for AI Software Factory.',
  },
  {
    id: 'contracts',
    interface: 'API contract explorer',
    app: 'software-factory-web',
    route: '/software-factory/api-contracts',
    notes: 'Schema, SDK, and governance context for frontend consumers.',
  },
  {
    id: 'control-plane',
    interface: 'Platform API explorer seam',
    app: 'platform-automation-web',
    route: '/api-explorer',
    notes: 'Landing surface for control-plane BFF integration, normalized policy enforcement, and future platform SDK views.',
  },
] as const;

export default function ApiReferenceDocsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Docs"
        title="API reference"
        description="Reference map for where API exploration lives in the product applications and how the shared client seams are expected to evolve."
      />
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <DataTable
          title="Explorer entry points"
          rows={referenceRows.map((row) => ({ ...row }))}
          columns={[
            { header: 'Interface', render: (row) => row.interface },
            { header: 'Application', render: (row) => row.app },
            { header: 'Route', render: (row) => row.route },
            { header: 'Notes', render: (row) => row.notes },
          ]}
        />
        <DetailList
          title="Reference principles"
          items={[
            {
              label: 'One source of truth',
              value: 'Route surfaces can specialize, but shared client packages own request shapes, typing, and mock fallbacks.',
            },
            {
              label: 'Explorer posture',
              value: 'Swagger is treated as a working product surface for Software Factory, not a hidden developer-only utility.',
            },
            {
              label: 'BFF enforcement',
              value: 'Browser-facing routes should prefer BFF boundaries when tenant, auth, or SpiceDB checks must be applied before data is exposed.',
            },
          ]}
        />
      </div>
    </div>
  );
}
