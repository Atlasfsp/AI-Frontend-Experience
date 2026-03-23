import { DataTable, DetailList, DocsCodePanel, Modal, PageHeader } from '@bac/ui';

import { releaseRows } from '@/features/data';

export default function ReleaseManagerPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Release Manager"
        title="Release manager"
        description="Coordinate promotion windows, candidate risk, approvals, and rollback readiness from a single operator-facing surface."
        actions={
          <Modal
            description="This checklist is the starting point for the live promotion flow."
            title="Release checklist"
            triggerLabel="Preview checklist"
          >
            <DocsCodePanel
              tabs={[
                {
                  content:
                    '1. Verify build, policy, and provenance gates.\n\n2. Confirm rollout window and approvers.\n\n3. Attach rollback and communication plans.\n\n4. Promote through the release API once checks pass.',
                  id: 'docs',
                  label: 'Checklist',
                },
              ]}
              title="Promotion workflow"
            />
          </Modal>
        }
      />
      <DataTable
        columns={[
          { header: 'Candidate', render: (row) => row.candidate },
          { header: 'Window', render: (row) => row.window },
          { header: 'Owner', render: (row) => row.owner },
          { header: 'Risk', render: (row) => row.risk },
          { header: 'Status', render: (row) => row.status },
        ]}
        rows={releaseRows}
        title="Promotion queue"
      />
      <DetailList
        items={[
          {
            hint: 'Connects directly to the compliance terminal and audit surfaces.',
            label: 'Approval model',
            value: 'Human-in-the-loop with evidence bundle',
          },
          {
            hint: 'Route reserved for rollout controls and eventual progressive delivery integration.',
            label: 'Future integration',
            value: 'Promotion API + deployment orchestration',
          },
        ]}
        title="Release system posture"
      />
    </div>
  );
}
