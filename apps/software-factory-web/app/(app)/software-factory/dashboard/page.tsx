import Link from 'next/link';

import { getSoftwareFactoryOverview, listAgents, listBuilds, listWorkItems } from '@bac/api-clients';
import { loadWebConfig } from '@bac/config';
import {
  DataTable,
  Drawer,
  PageHeader,
  StatGrid,
} from '@bac/ui';

import {
  sdkIntegrationSnippet,
  softwareFactoryQuickActions,
} from '@/features/data';
import { DualPlaneCommandCenter } from '@/features/dual-plane-command-center';
import { createFactoryRequestContext } from '@/features/request-context';
import { classifyFactoryDataSource } from '@/features/telemetry-provenance';
import { getServerSession } from '@/lib/session';

export default async function DashboardPage() {
  const session = await getServerSession();
  const context = createFactoryRequestContext(session);
  const config = loadWebConfig();
  const [overviewResult, buildsResult, workItemsResult, agentsResult] = await Promise.allSettled([
    getSoftwareFactoryOverview(context),
    listBuilds(context),
    listWorkItems(context),
    listAgents(context),
  ]);
  const allAvailable = [overviewResult, buildsResult, workItemsResult, agentsResult]
    .every((result) => result.status === 'fulfilled');
  const source = classifyFactoryDataSource(config.enableMockApi, allAvailable);
  const overview = overviewResult.status === 'fulfilled' ? overviewResult.value : null;
  const builds = buildsResult.status === 'fulfilled' ? buildsResult.value : [];
  const workItems = workItemsResult.status === 'fulfilled' ? workItemsResult.value : [];
  const agents = agentsResult.status === 'fulfilled' ? agentsResult.value : [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Software Factory Dashboard"
        title="AI Software Factory command center"
        description="Source-labelled factory operations and application delivery, with independent evidence gates and no fabricated production health."
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
      <DualPlaneCommandCenter agents={agents} builds={builds} workItems={workItems} source={source} />
      <StatGrid
        items={[
          {
            description: source.caution,
            label: 'Reported active builds',
            status: 'neutral',
            value: source.mode === 'DEMO' ? 'Demo' : (overview ? String(overview.activeBuilds) : 'Unavailable'),
          },
          {
            description: 'API reports only; never signed delivery admission.',
            label: 'Reported gate pass rate',
            status: 'neutral',
            value: source.mode === 'DEMO' ? 'Demo' : (overview ? overview.gatePassRate : 'Unavailable'),
          },
          {
            description: 'Pending review counts are not permission to deploy.',
            label: 'Reported open reviews',
            status: 'neutral',
            value: source.mode === 'DEMO' ? 'Demo' : (overview ? String(overview.openReviews) : 'Unavailable'),
          },
          {
            description: 'CI provenance unavailable until trusted signing/verification is connected.',
            label: 'Independently verified CI',
            status: 'neutral',
            value: 'Not connected',
          },
        ]}
      />
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
        title={source.mode === 'DEMO' ? 'Execution queue — demo records' : 'Execution queue — API reported, unverified'}
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
        title={source.mode === 'DEMO' ? 'Build queue — demo records' : 'Build queue — API reported, unverified'}
      />
    </div>
  );
}
