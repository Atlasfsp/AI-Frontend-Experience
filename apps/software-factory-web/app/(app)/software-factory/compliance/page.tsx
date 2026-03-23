import { DetailList, PageHeader, TerminalPanel, Timeline } from '@bac/ui';

import { complianceTerminalLines, softwareFactoryTimeline } from '@/features/data';

export default function CompliancePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Compliance Terminal"
        title="Compliance terminal"
        description="Review release evidence, policy posture, provenance, and next operator actions in a terminal-oriented workflow that still fits the broader enterprise shell."
      />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <TerminalPanel lines={complianceTerminalLines} title="Release evidence inspection" />
        <Timeline items={softwareFactoryTimeline} title="Linked review events" />
      </div>
      <DetailList
        items={[
          {
            hint: 'Every promotion path must attach provenance, rollback, and control evidence.',
            label: 'Mandatory bundle',
            value: 'SBOM + provenance + rollback plan',
          },
          {
            hint: 'Results surface in build, release manager, and audit pages.',
            label: 'Downstream impact',
            value: 'Shared compliance status',
          },
        ]}
        title="Compliance model"
      />
    </div>
  );
}
