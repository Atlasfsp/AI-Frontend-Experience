import { DataTable, DetailList, PageHeader } from '@bac/ui';

import { domainModelRows } from '@/features/data';

export default function DomainModelPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Domain Model Viewer"
        title="Domain model viewer"
        description="Bounded contexts, aggregates, invariants, and signals that shape how the AI Software Factory web experience grows over time."
      />
      <DataTable
        columns={[
          { header: 'Aggregate', render: (row) => row.aggregate },
          { header: 'Boundary', render: (row) => row.boundary },
          { header: 'Invariant', render: (row) => row.invariant },
          { header: 'Signals', render: (row) => row.signals },
        ]}
        description="These entities are the backbone for intake, execution, promotion, and audit surfaces."
        rows={domainModelRows}
        title="Factory aggregates"
      />
      <DetailList
        items={[
          {
            hint: 'Each page should bind to domain language first and transport details second.',
            label: 'Frontend rule',
            value: 'Use domain terms in route and component design',
          },
          {
            hint: 'Supports future generated models without rewriting page systems.',
            label: 'Integration posture',
            value: 'Transport-agnostic domain view models',
          },
        ]}
        title="Why this matters"
      />
    </div>
  );
}
