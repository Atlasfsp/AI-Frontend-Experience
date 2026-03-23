import { DataTable, DetailList, PageHeader } from '@bac/ui';

const platformRows = [
  {
    id: 'dashboard',
    route: '/platform/dashboard',
    purpose: 'Global control plane health, fleet stats, and recent operational signals.',
  },
  {
    id: 'regions',
    route: '/platform/regions',
    purpose: 'Regional posture, cluster readiness, and capacity-aware expansion planning.',
  },
  {
    id: 'workspace-factory',
    route: '/platform/workspace-factory',
    purpose: 'Tenant and workspace provisioning queue with lifecycle and ownership context.',
  },
  {
    id: 'gitops',
    route: '/platform/gitops',
    purpose: 'Deployment convergence, drift review, and GitOps promotion details.',
  },
  {
    id: 'incidents',
    route: '/platform/incidents',
    purpose: 'Incident timelines, DR posture, and active response coordination context.',
  },
] as const;

export default function PlatformDocsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Docs"
        title="Platform guides"
        description="The platform web app is the operator control plane for regional infrastructure, tenancy, deployment health, identity, incidents, and cost governance."
      />
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <DataTable
          title="Platform route guide"
          rows={platformRows.map((row) => ({ ...row }))}
          columns={[
            { header: 'Route', render: (row) => row.route },
            { header: 'Purpose', render: (row) => row.purpose },
          ]}
        />
        <DetailList
          title="Operator focus areas"
          items={[
            {
              label: 'Regional operations',
              value: 'Track readiness per region and cluster so capacity and failure patterns stay visible before incidents escalate.',
            },
            {
              label: 'Tenant factory',
              value: 'Keep workspace provisioning separate from day-two identity and policy governance so workflows stay understandable.',
            },
            {
              label: 'Cost and quotas',
              value: 'Quota and cost dashboards are first-class views because platform automation decisions affect product velocity and tenant safety.',
            },
          ]}
        />
      </div>
    </div>
  );
}
