import { getBuild } from '@bac/api-clients';
import { listWorkItems } from '@bac/api-clients';
import { Card, DataTable, DetailList, DocsCodePanel, Drawer, MiniBarChart, Modal, PageHeader, StatGrid, TerminalPanel, Timeline } from '@bac/ui';

import { getBuildDetailModel } from '@/features/build-detail';
import { createFactoryRequestContext } from '@/features/request-context';
import { getServerSession } from '@/lib/session';

export default async function BuildDetailPage({
  params,
}: {
  params: Promise<{ buildId: string }>;
}) {
  const { buildId } = await params;
  const session = await getServerSession();
  const requestContext = createFactoryRequestContext(session);
  const [build, workItems] = await Promise.all([
    getBuild(buildId, requestContext),
    listWorkItems(requestContext),
  ]);
  const detail = getBuildDetailModel(buildId);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Build Detail"
        title={build.name}
        description="Full build dossier with stage timing, gates, artifacts, linked work, and promotion guidance."
        actions={
          <>
            <Modal
              title="Promote release candidate"
              description="Promotion stays explicit so release evidence, rollback posture, and policy sign-off are visible before the build leaves the queue."
              triggerLabel="Promote candidate"
            >
              <div className="space-y-4 text-sm text-slate-300">
                <p>Lane: {detail.lane}</p>
                <p>Triggered by: {detail.triggeredBy}</p>
                <p>Current gate posture: {build.status}</p>
                <p>Use the release manager after final approval to execute the real promotion command.</p>
              </div>
            </Modal>
            <Drawer
              title="Recovery runbook"
              description="Use this build-specific recovery guidance if a manual review or failed stage needs attention."
              triggerLabel="Open recovery runbook"
            >
              <DocsCodePanel
                title="Recovery commands"
                tabs={[
                  {
                    id: 'commands',
                    label: 'Commands',
                    kind: 'code',
                    content: detail.remediationSnippet,
                  },
                  {
                    id: 'notes',
                    label: 'Notes',
                    content:
                      'Retry verification only after the underlying finding is understood.\n\nIf a release lane is already staged, confirm rollback evidence is still current before promoting.\n\nUse the release manager route for the audited promotion path.',
                  },
                ]}
              />
            </Drawer>
          </>
        }
      />

      <StatGrid
        items={[
          {
            label: 'Build ID',
            value: build.id,
            description: 'Stable build identifier used across artifacts, evidence, and release queues.',
          },
          {
            label: 'Current stage',
            value: build.stage,
            description: 'Current execution phase in the delivery mesh.',
            status: build.status,
          },
          {
            label: 'Release lane',
            value: detail.lane,
            description: 'Promotion lane reserved for this candidate.',
          },
          {
            label: 'Last update',
            value: build.updatedAt,
            description: 'Most recent state transition recorded for this build.',
          },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <DetailList
          title="Build dossier"
          items={[
            { label: 'Branch', value: detail.branch },
            { label: 'Commit', value: detail.commitSha, monospace: true },
            { label: 'Triggered by', value: detail.triggeredBy },
            { label: 'Status', value: build.status },
            { label: 'Stage', value: build.stage },
            { label: 'Workspace', value: session?.workspaceId ?? 'workspace-core' },
          ]}
        />
        <Card className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Stage timing</h2>
            <p className="text-sm text-slate-300">
              Relative timing across the build lifecycle to highlight where the release candidate is spending its time.
            </p>
          </div>
          <MiniBarChart items={detail.stageChart} />
        </Card>
      </div>

      <DataTable
        title="Stage execution"
        description="Granular timing and ownership for the path from intake-ready bundle to promotion-ready candidate."
        rows={detail.stageRows}
        columns={[
          { header: 'Stage', render: (row) => row.stage },
          { header: 'Owner', render: (row) => row.owner },
          { header: 'Duration', render: (row) => row.duration },
          { header: 'Status', render: (row) => row.status },
          { header: 'Detail', render: (row) => row.detail },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <DataTable
          title="Quality and policy gates"
          rows={detail.gateRows}
          columns={[
            { header: 'Gate', render: (row) => row.gate },
            { header: 'Owner', render: (row) => row.owner },
            { header: 'Status', render: (row) => row.status },
            { header: 'Evidence', render: (row) => row.evidence },
          ]}
        />
        <DataTable
          title="Artifacts"
          rows={detail.artifacts}
          columns={[
            { header: 'Kind', render: (row) => row.kind },
            { header: 'Digest', render: (row) => row.digest },
            { header: 'Location', render: (row) => row.location },
            { header: 'Status', render: (row) => row.status },
          ]}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Timeline title="Build timeline" items={detail.timeline} />
        <DataTable
          title="Linked work items"
          description="The build is connected back to active planning and delivery work so reviewers can inspect context without leaving the dossier."
          rows={workItems}
          columns={[
            { header: 'Work item', render: (row) => row.title },
            { header: 'Owner', render: (row) => row.owner },
            { header: 'Priority', render: (row) => row.priority },
            { header: 'Status', render: (row) => row.status },
          ]}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <TerminalPanel title="Build terminal" lines={detail.terminalLines} />
        <DocsCodePanel
          title="Promotion and recovery"
          description="Keep the build detail route useful during both green-path promotion and failure recovery."
          tabs={[
            {
              id: 'commands',
              label: 'Commands',
              kind: 'code',
              content: detail.remediationSnippet,
            },
            {
              id: 'guidance',
              label: 'Guidance',
              content:
                'Promote from the release manager after confirming all evidence links are current.\n\nIf verification is blocked, resolve the underlying control issue before re-running the stage.\n\nUse the linked work items to see whether the build should remain in the queue or be superseded.',
            },
          ]}
        />
      </div>
    </div>
  );
}
