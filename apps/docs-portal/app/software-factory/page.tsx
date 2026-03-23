import { DataTable, DetailList, PageHeader } from '@bac/ui';

const factoryRows = [
  {
    id: 'dashboard',
    route: '/software-factory/dashboard',
    purpose: 'Executive operating view for PRD throughput, build health, and recent delivery signals.',
  },
  {
    id: 'prd-intake',
    route: '/software-factory/prd-intake',
    purpose: 'Structured intake for product requirements, review readiness, and downstream generation handoff.',
  },
  {
    id: 'architecture',
    route: '/software-factory/architecture',
    purpose: 'Architecture streams, service boundaries, and implementation concerns tied to active delivery work.',
  },
  {
    id: 'contracts',
    route: '/software-factory/api-contracts and /software-factory/swagger',
    purpose: 'Contract explorer and first-class Swagger/OpenAPI experience for delivery teams and reviewers.',
  },
  {
    id: 'release',
    route: '/software-factory/release-manager',
    purpose: 'Release queue, evidence review, and promotion decision support.',
  },
] as const;

export default function SoftwareFactoryDocsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Docs"
        title="Software Factory guides"
        description="The Software Factory app turns product definition, architecture review, contracts, builds, and release evidence into one coherent operator workflow."
      />
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <DataTable
          title="Factory route guide"
          rows={factoryRows.map((row) => ({ ...row }))}
          columns={[
            { header: 'Route', render: (row) => row.route },
            { header: 'Purpose', render: (row) => row.purpose },
          ]}
        />
        <DetailList
          title="Experience principles"
          items={[
            {
              label: 'One delivery surface',
              value: 'Teams should move from PRD intake to release evidence without context switching into unrelated admin tooling.',
            },
            {
              label: 'Contract-first confidence',
              value: 'Swagger and API contracts are surfaced as first-class screens so delivery risk is visible before integration work ships.',
            },
            {
              label: 'Auditability',
              value: 'Activity, compliance terminal output, and access views exist to support production governance, not just development convenience.',
            },
          ]}
        />
      </div>
    </div>
  );
}
