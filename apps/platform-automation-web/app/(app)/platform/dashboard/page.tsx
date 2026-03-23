import Link from 'next/link';

import { getPlatformOverview, listClusters, listWorkspaces } from '@bac/api-clients';
import { Card, DataTable, MiniBarChart, PageHeader, StatGrid, Timeline } from '@bac/ui';

import {
  controlPlaneChart,
  observabilityTimeline,
  platformQuickActions,
} from '@/features/data';
import { createPlatformRequestContext } from '@/features/request-context';
import { getServerSession } from '@/lib/session';

export default async function PlatformDashboardPage() {
  const session = await getServerSession();
  const context = createPlatformRequestContext(session);
  const [overview, clusters, workspaces] = await Promise.all([
    getPlatformOverview(context),
    listClusters(context),
    listWorkspaces(context),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Global Control Plane Dashboard"
        title="Platform control plane"
        description="Operate regional clusters, workspace provisioning, GitOps posture, policy findings, and disaster recovery readiness from one enterprise control surface."
        actions={platformQuickActions.slice(0, 2).map((action) => (
          <Link
            key={action.href}
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
            href={action.href}
          >
            {action.label}
          </Link>
        ))}
      />
      <StatGrid
        items={[
          {
            description: 'Tenant workspaces currently governed by the platform control plane.',
            label: 'Managed workspaces',
            status: 'neutral',
            value: String(overview.managedWorkspaces),
          },
          {
            description: 'Open alerts or incidents needing operator attention.',
            label: 'Active alerts',
            status: 'warning',
            value: String(overview.activeAlerts),
          },
          {
            description: 'Current GitOps convergence baseline across regions.',
            label: 'Fleet sync',
            status: 'success',
            value: overview.fleetSync,
          },
          {
            description: 'Regional health distribution across active clusters.',
            label: 'Cluster health',
            status: 'warning',
            value: overview.clusterHealth,
          },
        ]}
      />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Control plane posture</h2>
            <p className="text-sm text-slate-300">
              Platform readiness is measured as cluster convergence, tenant factory throughput, and policy findings.
            </p>
          </div>
          <MiniBarChart items={controlPlaneChart} />
        </Card>
        <Timeline items={observabilityTimeline} title="Signals and incidents" />
      </div>
      <DataTable
        columns={[
          { header: 'Cluster', render: (row) => row.id },
          { header: 'Region', render: (row) => row.region },
          { header: 'Status', render: (row) => row.status },
          { header: 'Workloads', render: (row) => row.workloadCount },
        ]}
        description="Cluster inventory with direct drill-ins into regions, GitOps, and observability."
        rows={clusters}
        title="Regional cluster estate"
      />
      <DataTable
        columns={[
          { header: 'Workspace', render: (row) => row.id },
          { header: 'Tenant', render: (row) => row.tenant },
          { header: 'Promises', render: (row) => row.promiseCount },
          { header: 'Status', render: (row) => row.status },
        ]}
        description="Tenant workspaces and promise usage readiness."
        rows={workspaces}
        title="Workspace estate"
      />
    </div>
  );
}
