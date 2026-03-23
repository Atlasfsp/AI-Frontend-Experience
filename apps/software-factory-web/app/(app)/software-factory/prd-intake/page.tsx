import { DetailList, DocsCodePanel, MiniBarChart, Modal, PageHeader } from '@bac/ui';

import { prdReadinessChart, prdTemplateSnippet } from '@/features/data';

export default function PrdIntakePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="PRD Intake"
        title="PRD intake system"
        description="Capture requirements with explicit outcome framing, architecture context, contract impact, compliance controls, and release expectations from the start."
        actions={
          <Modal
            description="Use this typed contract as the basis for the shared intake API and generated clients."
            title="PRD intake template"
            triggerLabel="Open typed template"
          >
            <DocsCodePanel
              tabs={[
                {
                  content:
                    'This contract keeps intake consistent across UI, API validation, and downstream workflow orchestration.\n\nEvery PRD submission is expected to capture business outcome, metrics, API impact, and release controls.',
                  id: 'docs',
                  label: 'Guidance',
                },
                { content: prdTemplateSnippet, id: 'code', kind: 'code', label: 'Type contract' },
              ]}
              title="Shared intake contract"
            />
          </Modal>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DocsCodePanel
          description="The intake flow is intentionally structured so every downstream page starts with the same requirement truth."
          tabs={[
            {
              content:
                'Step 1: capture business outcome and target operator.\n\nStep 2: record acceptance criteria, API dependencies, and architecture touchpoints.\n\nStep 3: attach controls for rollout, audit, rollback, and ownership.',
              id: 'docs',
              label: 'Workflow',
            },
            { content: prdTemplateSnippet, id: 'code', kind: 'code', label: 'Schema' },
          ]}
          title="Intake blueprint"
        />
        <MiniBarChart items={prdReadinessChart} />
      </div>
      <DetailList
        items={[
          {
            hint: 'Links the intake page directly to the architecture viewer and ADR system.',
            label: 'Design review',
            value: 'Architecture references required',
          },
          {
            hint: 'Feeds generated client and OpenAPI explorer readiness.',
            label: 'API impact',
            value: 'Contract ownership recorded at intake',
          },
          {
            hint: 'Supports later policy automation and release gating.',
            label: 'Compliance controls',
            value: 'Checklist attached before build start',
          },
          {
            hint: 'Ensures work enters the build dashboard with traceable ownership.',
            label: 'Execution handoff',
            value: 'Planner and release manager assigned',
          },
        ]}
        title="Definition of ready"
      />
    </div>
  );
}
