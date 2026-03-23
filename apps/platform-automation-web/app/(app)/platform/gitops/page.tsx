import { DataTable, DocsCodePanel, PageHeader, TerminalPanel } from '@bac/ui';

import { gitopsRows, gitopsSnippet } from '@/features/data';

export default function GitopsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="GitOps / Deployment Status"
        title="GitOps and deployment status"
        description="Track convergence, rollout drift, and regional deployment posture across the platform automation estate."
      />
      <DataTable
        columns={[
          { header: 'Target', render: (row) => row.target },
          { header: 'Status', render: (row) => row.status },
          { header: 'Drift', render: (row) => row.drift },
          { header: 'Updated', render: (row) => row.updatedAt },
        ]}
        rows={gitopsRows}
        title="Fleet convergence"
      />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <TerminalPanel
          lines={[
            '$ bac gitops diff --target eu-prod',
            'bundle bac-platform-core ........ drift detected',
            'namespace payments-prod ........ 2 manifests out of sync',
            'next_action .................... review rollout window',
          ]}
          title="GitOps diff"
        />
        <DocsCodePanel
          tabs={[
            {
              content:
                'GitOps surfaces belong in the platform UI because rollout health directly affects regional operations, incident response, and quota decisions.',
              id: 'docs',
              label: 'Context',
            },
            { content: gitopsSnippet, id: 'code', kind: 'code', label: 'Manifest example' },
          ]}
          title="GitOps integration point"
        />
      </div>
    </div>
  );
}
