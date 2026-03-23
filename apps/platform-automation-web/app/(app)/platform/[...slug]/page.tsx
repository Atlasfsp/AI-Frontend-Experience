import { notFound } from 'next/navigation';

import { listClusters, listPromises, listWorkspaces } from '@bac/api-clients';
import { Card, DataTable, PageHeader, StatGrid } from '@bac/ui';

import { getServerSession } from '@/lib/session';

export default async function PlatformDeepPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const key = slug.join('/');
  const session = await getServerSession();
  const context = {
    accessToken: session?.accessToken,
    tenantId: session?.tenantId,
    workspaceId: session?.workspaceId,
  };

  if (slug[0] === 'clusters' && slug.length === 2) {
    const cluster = (await listClusters(context)).find((item) => item.id === slug[1]);

    if (!cluster) {
      notFound();
    }

    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Cluster Detail"
          title={cluster.id}
          description="Regional workload, resilience posture, and operator-visible drift."
        />
        <StatGrid
          items={[
            { description: 'Serving region', label: 'Region', value: cluster.region },
            { description: 'Health posture', label: 'Status', status: cluster.status === 'healthy' ? 'success' : 'warning', value: cluster.status },
            { description: 'Tracked workloads', label: 'Workloads', value: String(cluster.workloadCount) },
            { description: 'GitOps convergence', label: 'Fleet sync', value: '98.9%' },
          ]}
        />
      </div>
    );
  }

  if (slug[0] === 'workspaces' && slug.length === 2) {
    const workspace = (await listWorkspaces(context)).find((item) => item.id === slug[1]);

    if (!workspace) {
      notFound();
    }

    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Workspace Detail"
          title={workspace.id}
          description="Workspace posture across promises, health, and tenant ownership."
        />
        <StatGrid
          items={[
            { description: 'Owning tenant', label: 'Tenant', value: workspace.tenant },
            { description: 'Workspace health summary', label: 'Status', status: workspace.status === 'healthy' ? 'success' : 'warning', value: workspace.status },
            { description: 'Installed promises', label: 'Promises', value: String(workspace.promiseCount) },
            { description: 'Default access profile', label: 'Data access', value: 'Hasura + governed console' },
          ]}
        />
      </div>
    );
  }

  if (slug[0] === 'promises' && slug.length === 2) {
    const promise = (await listPromises(context)).find((item) => item.id === slug[1]);

    if (!promise) {
      notFound();
    }

    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Promise Detail"
          title={promise.title}
          description="Service promise contract, lifecycle expectations, and claim posture."
        />
        <Card className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Owner</p>
            <p className="mt-2 text-lg font-semibold text-white">{promise.owner}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Status</p>
            <p className="mt-2 text-lg font-semibold text-white">{promise.status}</p>
          </div>
        </Card>
      </div>
    );
  }

  if (key === 'fleet') {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Fleet"
          title="Fleet convergence"
          description="GitOps sync state, rollout waves, and regional drift posture."
        />
        <DataTable
          columns={[
            { header: 'Region', render: (row) => row.region },
            { header: 'Sync state', render: (row) => row.state },
            { header: 'Last update', render: (row) => row.updatedAt },
          ]}
          rows={[
            { id: 'ng', region: 'Nigeria', state: 'in-sync', updatedAt: '2m ago' },
            { id: 'za', region: 'South Africa', state: 'in-sync', updatedAt: '4m ago' },
            { id: 'eu', region: 'Europe', state: 'drift-detected', updatedAt: '1m ago' },
          ]}
          title="Regional convergence"
        />
      </div>
    );
  }

  if (key === 'data-access') {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Data Access"
          title="Hasura endpoints"
          description="Governed GraphQL endpoints provisioned through the hasura-endpoint promise."
        />
        <DataTable
          columns={[
            { header: 'Endpoint', render: (row) => row.name },
            { header: 'Size', render: (row) => row.size },
            { header: 'Auth', render: (row) => row.auth },
            { header: 'Console', render: (row) => row.console },
          ]}
          rows={[
            { auth: 'authentik', console: 'disabled', id: 'payments-core', name: 'payments-core', size: 'medium' },
            { auth: 'authentik', console: 'disabled', id: 'retail-cloud', name: 'retail-cloud', size: 'small' },
          ]}
          title="Workspace endpoints"
        />
      </div>
    );
  }

  if (slug[0] === 'data-access' && slug.length === 2) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="GraphQL Endpoint"
          title={slug[1] ?? 'Workspace endpoint'}
          description="Promise-backed endpoint sizing, auth posture, and console readiness."
        />
        <Card className="space-y-3 text-sm text-slate-300">
          <p>Fields aligned to the Kratix `hasura-endpoint` promise: size, databaseRef, authProvider, enableConsole.</p>
          <p>Production path: claim edits submit through the governed platform API, not direct cluster mutation.</p>
        </Card>
      </div>
    );
  }

  if (slug[0] === 'observability' && slug.length === 2) {
    const signal = slug[1];
    const titleMap: Record<string, string> = {
      alerts: 'Active alerts',
      logs: 'Logs',
      metrics: 'Metrics',
      traces: 'Traces',
    };

    if (!signal || !titleMap[signal]) {
      notFound();
    }

    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Observability"
          title={titleMap[signal]}
          description="Focused operational view for the selected signal type."
        />
        <Card className="space-y-3 text-sm text-slate-300">
          <p>This slice is prepared for VictoriaMetrics, Tempo, OpenObserve, and incident-routing drill-ins.</p>
        </Card>
      </div>
    );
  }

  if (key === 'networking') {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Networking"
          title="Network policy posture"
          description="Ingress exposure, service mesh expectations, and regional edge routing."
        />
        <Card className="space-y-3 text-sm text-slate-300">
          <p>Tracked views: ingress endpoints, service mesh policy drift, cross-region failover posture, and egress governance.</p>
        </Card>
      </div>
    );
  }

  if (key === 'compliance') {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Compliance"
          title="Platform compliance"
          description="Audit-friendly posture across promises, cluster policy, and data-access governance."
        />
        <StatGrid
          items={[
            { description: 'Promises within expected policy envelope', label: 'Compliant promises', status: 'success', value: '94%' },
            { description: 'Clusters needing operator follow-up', label: 'Open findings', status: 'warning', value: '4' },
            { description: 'High-risk exceptions awaiting approval', label: 'Exceptions', status: 'danger', value: '1' },
            { description: 'Last audit export completion', label: 'Audit export', value: '14m ago' },
          ]}
        />
      </div>
    );
  }

  notFound();
}
