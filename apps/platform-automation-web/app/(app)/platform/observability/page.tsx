import { MiniBarChart, PageHeader, Timeline } from '@bac/ui';

import { controlPlaneChart, observabilityTimeline } from '@/features/data';

export default function ObservabilityPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Observability Dashboard"
        title="Observability dashboard"
        description="Trace, metrics, logs, and alerts landing area with hooks ready for Tempo, VictoriaMetrics, OpenObserve, and incident response routing."
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <MiniBarChart items={controlPlaneChart} />
        <Timeline items={observabilityTimeline} title="Live signal timeline" />
      </div>
    </div>
  );
}
