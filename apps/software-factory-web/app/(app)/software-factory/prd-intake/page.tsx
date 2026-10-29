import { DetailList, DocsCodePanel, MiniBarChart, PageHeader } from '@bac/ui';

import { CreateIntake } from '@/components/create-intake';
import { getServerSession } from '@/lib/session';

import { prdReadinessChart, prdTemplateSnippet } from '@/features/data';

export default async function PrdIntakePage() {
  const session = await getServerSession();
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="FluxCore Create"
        title="Start with what you want to build"
        description="No technical specification required. Share your idea in plain language and refine the plan with a proposed application expert."
      />
      {session && (
        <CreateIntake
          tenantId={session.tenantId}
          workspaceId={session.workspaceId}
        />
      )}
      <details className="rounded-3xl border border-white/10 bg-slate-900/40 p-5">
        <summary className="cursor-pointer font-medium text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
          Engineering intake details
        </summary>
        <div className="mt-6 space-y-6">
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
                {
                  content: prdTemplateSnippet,
                  id: 'code',
                  kind: 'code',
                  label: 'Schema',
                },
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
      </details>
    </div>
  );
}
