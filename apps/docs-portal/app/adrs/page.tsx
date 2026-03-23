import { DataTable, PageHeader } from '@bac/ui';

const adrRows = [
  {
    id: 'adr-001',
    adr: 'ADR-001',
    decision: 'Use a monorepo with shared packages for UI, auth, config, observability, and API clients.',
    consequence: 'Product apps stay focused on route composition while shared seams evolve centrally.',
  },
  {
    id: 'adr-002',
    adr: 'ADR-002',
    decision: 'Treat Swagger/OpenAPI as a first-class Software Factory surface rather than a hidden developer utility.',
    consequence: 'Frontend, platform, and reviewer teams can inspect contracts from a shared operator experience.',
  },
  {
    id: 'adr-003',
    adr: 'ADR-003',
    decision: 'Keep auth-aware routing explicit in middleware and layout layers.',
    consequence: 'Role-based navigation and protected screens remain transparent and testable.',
  },
  {
    id: 'adr-004',
    adr: 'ADR-004',
    decision: 'Prefer mock-capable client seams over direct page fetch logic.',
    consequence: 'Local development and contract evolution remain productive before all live services exist.',
  },
] as const;

export default function AdrDocsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Docs"
        title="Architecture decisions"
        description="The most important decisions behind the AI Frontend Experience foundation and why they were chosen."
      />
      <DataTable
        title="Active ADR themes"
        rows={adrRows.map((row) => ({ ...row }))}
        columns={[
          { header: 'ADR', render: (row) => row.adr },
          { header: 'Decision', render: (row) => row.decision },
          { header: 'Consequence', render: (row) => row.consequence },
        ]}
      />
    </div>
  );
}
