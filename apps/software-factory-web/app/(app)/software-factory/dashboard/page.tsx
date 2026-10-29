import Link from 'next/link';

import {
  getSoftwareFactoryOverview,
  listAgents,
  listBuilds,
  listWorkItems,
} from '@bac/api-clients';
import { loadWebConfig } from '@bac/config';
import { DataTable, Drawer, PageHeader, StatGrid } from '@bac/ui';

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
  const [overviewResult, buildsResult, workItemsResult, agentsResult] =
    await Promise.allSettled([
      getSoftwareFactoryOverview(context),
      listBuilds(context),
      listWorkItems(context),
      listAgents(context),
    ]);
  const allAvailable = [
    overviewResult,
    buildsResult,
    workItemsResult,
    agentsResult,
  ].every((result) => result.status === 'fulfilled');
  const source = classifyFactoryDataSource(
    config.enableMockApi,
    allAvailable,
    config.environment,
  );
  const overview =
    overviewResult.status === 'fulfilled' ? overviewResult.value : null;
  const builds = buildsResult.status === 'fulfilled' ? buildsResult.value : [];
  const workItems =
    workItemsResult.status === 'fulfilled' ? workItemsResult.value : [];
  const agents = agentsResult.status === 'fulfilled' ? agentsResult.value : [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Software Factory Dashboard"
        title="Build with FluxCore"
        description="Start with a plain-language idea in Create, or open Engineer for shared projects, repositories, and delivery tools."
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
      <section
        aria-labelledby="choose-workspace-mode"
        className="grid gap-4 lg:grid-cols-2"
      >
        <Link
          href="/software-factory/prd-intake"
          className="group rounded-3xl border border-cyan-200/20 bg-gradient-to-br from-cyan-300/[0.12] to-slate-900/70 p-6 transition hover:border-cyan-200/50 hover:from-cyan-300/[0.16] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
        >
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
            For a quick start
          </p>
          <h2
            id="choose-workspace-mode"
            className="mt-2 text-2xl font-semibold text-white"
          >
            FluxCore Create
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
            Describe what you want to make. Review a project outline and
            proposed application SME before you decide what happens next.
          </p>
          <span className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-cyan-200 px-4 font-semibold text-slate-950">
            Start with an idea{' '}
            <span aria-hidden="true" className="ml-2">
              →
            </span>
          </span>
        </Link>
        <Link
          href="/software-factory/workspaces"
          className="group rounded-3xl border border-violet-200/20 bg-gradient-to-br from-violet-300/[0.1] to-slate-900/70 p-6 transition hover:border-violet-200/50 hover:from-violet-300/[0.15] focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-300"
        >
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-200">
            For hands-on development
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            FluxCore Engineer
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
            Open tenant-shared projects, check the proposed SME and roles, link
            a repository, and continue into builds, tests, and release evidence.
          </p>
          <span className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-violet-200/30 bg-violet-200/10 px-4 font-semibold text-violet-100">
            Open engineering projects{' '}
            <span aria-hidden="true" className="ml-2">
              →
            </span>
          </span>
        </Link>
      </section>
      <DualPlaneCommandCenter
        agents={agents}
        builds={builds}
        workItems={workItems}
        source={source}
      />
      <StatGrid
        items={[
          {
            description: source.caution,
            label: 'Reported active builds',
            status: 'neutral',
            value:
              source.mode === 'DEMO'
                ? 'Demo'
                : source.mode === 'UNAVAILABLE'
                  ? 'Unavailable'
                  : overview
                    ? String(overview.activeBuilds)
                    : 'Unavailable',
          },
          {
            description: 'API reports only; never signed delivery admission.',
            label: 'Reported gate pass rate',
            status: 'neutral',
            value:
              source.mode === 'DEMO'
                ? 'Demo'
                : source.mode === 'UNAVAILABLE'
                  ? 'Unavailable'
                  : overview
                    ? overview.gatePassRate
                    : 'Unavailable',
          },
          {
            description: 'Pending review counts are not permission to deploy.',
            label: 'Reported open reviews',
            status: 'neutral',
            value:
              source.mode === 'DEMO'
                ? 'Demo'
                : source.mode === 'UNAVAILABLE'
                  ? 'Unavailable'
                  : overview
                    ? String(overview.openReviews)
                    : 'Unavailable',
          },
          {
            description:
              'CI provenance unavailable until trusted signing/verification is connected.',
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
        title={
          source.mode === 'DEMO'
            ? 'Execution queue — demo records'
            : 'Execution queue — API reported, unverified'
        }
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
        title={
          source.mode === 'DEMO'
            ? 'Build queue — demo records'
            : 'Build queue — API reported, unverified'
        }
      />
    </div>
  );
}
