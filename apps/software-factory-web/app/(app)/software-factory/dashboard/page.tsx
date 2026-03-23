import Link from 'next/link';

import { getSoftwareFactoryOverview, listBuilds, listWorkItems } from '@bac/api-clients';
import {
  Card,
  DataTable,
  Drawer,
  MiniBarChart,
  PageHeader,
  StatGrid,
  Timeline,
} from '@bac/ui';

import {
  buildTrendChart,
  sdkIntegrationSnippet,
  softwareFactoryQuickActions,
  softwareFactoryTimeline,
} from '@/features/data';
import { createFactoryRequestContext } from '@/features/request-context';
import { getServerSession } from '@/lib/session';

export default async function DashboardPage() {
  const session = await getServerSession();
  const context = createFactoryRequestContext(session);
  const [overview, builds, workItems] = await Promise.all([
    getSoftwareFactoryOverview(context),
    listBuilds(context),
    listWorkItems(context),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Software Factory Dashboard"
        title="AI Software Factory command center"
        description="Premium enterprise workspace for requirement intake, build quality, API contracts, and release controls across the AI Software Factory."
        actions={
          <>
            {softwareFactoryQuickActions.slice(0, 2).map((action) => (
              <Link
                key={action.href}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                href={action.href}
              >
                {action.label}
              </Link>
            ))}
            <Drawer
              description="Shared API client seam for build and contract drill-ins."
              title="Generated client integration"
              triggerLabel="Inspect SDK seam"
            >
              <pre className="overflow-x-auto rounded-[24px] border border-white/10 bg-slate-950/85 p-5 text-xs text-slate-200">
                <code>{sdkIntegrationSnippet}</code>
              </pre>
            </Drawer>
          </>
        }
      />
      <StatGrid
        items={[
          {
            description: 'Builds currently traversing the execution mesh.',
            label: 'Active builds',
            status: 'warning',
            value: String(overview.activeBuilds),
          },
          {
            description: 'Rolling pass rate across tests, policy, and provenance gates.',
            label: 'Gate pass rate',
            status: 'success',
            value: overview.gatePassRate,
          },
          {
            description: 'Work waiting on human review or approval.',
            label: 'Open reviews',
            status: 'neutral',
            value: String(overview.openReviews),
          },
          {
            description: overview.recentBuild.name,
            label: 'Latest build stage',
            status: overview.recentBuild.status,
            value: overview.recentBuild.stage,
          },
        ]}
      />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Build and test posture</h2>
            <p className="text-sm text-slate-300">
              Delivery health is modeled around passing gates, queued work, and explicit operator review points.
            </p>
          </div>
          <MiniBarChart items={buildTrendChart} />
        </Card>
        <Timeline items={softwareFactoryTimeline} title="Recent activity timeline" />
      </div>
      <DataTable
        columns={[
          {
            header: 'Priority work',
            render: (row) => (
              <Link
                className="font-semibold text-white underline decoration-cyan-300/40 underline-offset-4"
                href={`/software-factory/work-items/${row.id}`}
              >
                {row.title}
              </Link>
            ),
          },
          { header: 'Owner', render: (row) => row.owner },
          { header: 'Priority', render: (row) => row.priority },
          { header: 'Status', render: (row) => row.status },
        ]}
        description="Critical queue items moving from PRD readiness into architecture and build execution."
        rows={workItems}
        title="Execution queue"
      />
      <DataTable
        columns={[
          {
            header: 'Build',
            render: (row) => (
              <Link
                className="font-semibold text-white underline decoration-cyan-300/40 underline-offset-4"
                href={`/software-factory/builds/${row.id}`}
              >
                {row.name}
              </Link>
            ),
          },
          { header: 'Stage', render: (row) => row.stage },
          { header: 'Status', render: (row) => row.status },
          { header: 'Updated', render: (row) => row.updatedAt },
        ]}
        description="Top builds in flight with direct drill-ins into artifacts, gates, and release posture."
        rows={builds}
        title="Live build queue"
      />
    </div>
  );
}
