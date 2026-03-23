import { notFound } from 'next/navigation';

import { getBuild, listBuilds, listWorkItems } from '@bac/api-clients';
import { Card, DataTable, PageHeader, StatGrid } from '@bac/ui';

import { getServerSession } from '@/lib/session';

function createArtifactRows(buildId: string) {
  return [
    { id: `${buildId}-manifest`, name: 'Deployment manifest bundle', status: 'verified', type: 'manifest' },
    { id: `${buildId}-sbom`, name: 'SBOM package', status: 'verified', type: 'sbom' },
    { id: `${buildId}-provenance`, name: 'SLSA provenance', status: 'pending', type: 'attestation' },
  ];
}

export default async function SoftwareFactoryDeepPage({
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

  if (key === 'work-items/new') {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Work Item Intake"
          title="Submit a new work item"
          description="Production-oriented intake surface for requirement capture, acceptance framing, and execution readiness."
        />
        <Card className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Definition of ready</h2>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>Business outcome and operator-visible success criteria are explicit.</li>
              <li>Required APIs, data contracts, and environment dependencies are listed.</li>
              <li>Compliance and rollout gates are attached up front.</li>
            </ul>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-slate-950/60 p-5 text-sm text-slate-300">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Form scaffold</p>
            <p className="mt-4">Fields: title, business impact, target framework, acceptance criteria, compliance profile, target workspace.</p>
          </div>
        </Card>
      </div>
    );
  }

  if (slug[0] === 'work-items' && slug.length === 2) {
    const workItems = await listWorkItems(context);
    const workItem = workItems.find((item) => item.id === slug[1]);

    if (!workItem) {
      notFound();
    }

    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Work Item Detail"
          title={workItem.title}
          description="Execution context, acceptance framing, and current readiness posture."
        />
        <StatGrid
          items={[
            { description: 'Owning product area', label: 'Owner', value: workItem.owner },
            { description: 'Current execution state', label: 'Status', value: workItem.status, status: 'warning' },
            { description: 'Declared business priority', label: 'Priority', value: workItem.priority },
            { description: 'Latest orchestration update', label: 'Updated', value: workItem.updatedAt },
          ]}
        />
      </div>
    );
  }

  if (slug[0] === 'builds' && slug.length >= 2) {
    const buildId = slug[1];

    if (!buildId) {
      notFound();
    }

    const build = await getBuild(buildId, context);

    if (slug[2] === 'pipeline') {
      return (
        <div className="space-y-8">
          <PageHeader
            eyebrow="Pipeline"
            title={`${build.name} pipeline`}
            description="Pipeline stage sequencing, ownership transitions, and recovery checkpoints."
          />
          <DataTable
            columns={[
              { header: 'Stage', render: (row) => row.stage },
              { header: 'Owner', render: (row) => row.owner },
              { header: 'Status', render: (row) => row.status },
            ]}
            rows={[
              { id: '1', owner: 'Planner', stage: 'Requirement shaping', status: 'completed' },
              { id: '2', owner: 'Writer', stage: 'Implementation', status: 'completed' },
              { id: '3', owner: 'Reviewer', stage: 'Quality gates', status: build.stage },
              { id: '4', owner: 'Release', stage: 'Artifact publish', status: 'queued' },
            ]}
            title="Execution graph"
          />
        </div>
      );
    }

    if (slug[2] === 'gates') {
      return (
        <div className="space-y-8">
          <PageHeader
            eyebrow="Quality Gates"
            title={`${build.name} gate results`}
            description="Policy, test, and supply-chain status before promotion."
          />
          <DataTable
            columns={[
              { header: 'Gate', render: (row) => row.gate },
              { header: 'Result', render: (row) => row.result },
              { header: 'Detail', render: (row) => row.detail },
            ]}
            rows={[
              { detail: 'All unit and integration suites green', gate: 'Test suite', id: 'g1', result: 'pass' },
              { detail: 'Dependency vulnerability waiver required', gate: 'Security scan', id: 'g2', result: 'review' },
              { detail: 'Attestation upload pending', gate: 'Supply chain', id: 'g3', result: 'pending' },
            ]}
            title="Gate board"
          />
        </div>
      );
    }

    if (slug[2] === 'artifacts') {
      const rows = createArtifactRows(build.id);
      return (
        <div className="space-y-8">
          <PageHeader
            eyebrow="Artifacts"
            title={`${build.name} artifacts`}
            description="Release bundle evidence, provenance, and verification checkpoints."
          />
          <DataTable
            columns={[
              { header: 'Artifact', render: (row) => row.name },
              { header: 'Type', render: (row) => row.type },
              { header: 'Status', render: (row) => row.status },
            ]}
            rows={rows}
            title="Artifact inventory"
          />
        </div>
      );
    }
  }

  if (key === 'artifacts') {
    const builds = await listBuilds(context);
    const rows = builds.flatMap((build) => createArtifactRows(build.id));

    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Artifacts"
          title="Artifact lineage"
          description="Cross-build artifact visibility with verification posture and provenance coverage."
        />
        <DataTable
          columns={[
            { header: 'Artifact', render: (row) => row.name },
            { header: 'Type', render: (row) => row.type },
            { header: 'Status', render: (row) => row.status },
          ]}
          rows={rows}
          title="All recent artifacts"
        />
      </div>
    );
  }

  if (slug[0] === 'artifacts' && slug.length === 2) {
    const artifactId = slug[1];

    if (!artifactId) {
      notFound();
    }

    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Artifact Detail"
          title={artifactId}
          description="Verification status, download posture, and provenance linkage."
        />
        <Card className="space-y-3">
          <p className="text-sm text-slate-300">This detail view is ready for signed download URLs, SBOM inspection, and attestation evidence.</p>
        </Card>
      </div>
    );
  }

  if (key === 'code-review') {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Code Review"
          title="Review queue"
          description="Operator-facing review surfacing with change-risk and policy badges."
        />
        <DataTable
          columns={[
            { header: 'Review', render: (row) => row.title },
            { header: 'Risk', render: (row) => row.risk },
            { header: 'Gate', render: (row) => row.gate },
          ]}
          rows={[
            { gate: 'pending', id: 'review-1', risk: 'high', title: 'Payments release orchestration' },
            { gate: 'approved', id: 'review-2', risk: 'medium', title: 'Tenant quota enforcement' },
          ]}
          title="Pending reviews"
        />
      </div>
    );
  }

  if (slug[0] === 'code-review' && slug.length === 2) {
    const reviewId = slug[1];

    if (!reviewId) {
      notFound();
    }

    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Code Review Detail"
          title={reviewId}
          description="Review commentary, compliance annotations, and promotion readiness."
        />
        <Card className="space-y-3">
          <p className="text-sm text-slate-300">Diff presentation, compliance highlights, and approver notes land here once the SDX review APIs are connected.</p>
        </Card>
      </div>
    );
  }

  if (key === 'compliance') {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Compliance"
          title="Compliance posture"
          description="Evidence-backed release readiness across controls, attestations, and rollout policy."
        />
        <StatGrid
          items={[
            { description: 'Builds cleared for release', label: 'Release-ready', status: 'success', value: '12' },
            { description: 'Builds awaiting operator review', label: 'Manual review', status: 'warning', value: '3' },
            { description: 'Evidence bundles complete', label: 'Attestations', value: '97%' },
            { description: 'Critical policy failures this week', label: 'Critical failures', status: 'danger', value: '1' },
          ]}
        />
      </div>
    );
  }

  if (slug[0] === 'compliance' && slug.length === 2) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Compliance Detail"
          title={`Compliance evidence for ${slug[1]}`}
          description="Control-by-control evidence trail for a single build."
        />
        <Card className="space-y-3">
          <p className="text-sm text-slate-300">Planned integrations: signed attestations, test evidence, dependency posture, and audit export.</p>
        </Card>
      </div>
    );
  }

  if (key === 'analytics') {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Analytics"
          title="Delivery analytics"
          description="Lead time, build velocity, and gate performance for SDX operators."
        />
        <StatGrid
          items={[
            { description: 'Median requirement-to-build handoff', label: 'Lead time', value: '4.2h' },
            { description: 'Builds finishing within the target window', label: 'On-time builds', status: 'success', value: '92%' },
            { description: 'Average re-run rate this week', label: 'Re-run rate', status: 'warning', value: '8%' },
            { description: 'Mean time to gate recovery', label: 'Gate recovery', value: '37m' },
          ]}
        />
      </div>
    );
  }

  if (key === 'webhooks') {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Webhooks"
          title="Outbound integrations"
          description="Delivery posture for downstream approvals, chatops, and audit webhooks."
        />
        <DataTable
          columns={[
            { header: 'Destination', render: (row) => row.destination },
            { header: 'Scope', render: (row) => row.scope },
            { header: 'Last delivery', render: (row) => row.status },
          ]}
          rows={[
            { destination: 'Slack approval channel', id: 'wh-1', scope: 'gate.failure', status: 'healthy' },
            { destination: 'Audit archive', id: 'wh-2', scope: 'artifact.verified', status: 'healthy' },
            { destination: 'Pager escalation', id: 'wh-3', scope: 'deployment.blocked', status: 'retrying' },
          ]}
          title="Webhook health"
        />
      </div>
    );
  }

  notFound();
}
