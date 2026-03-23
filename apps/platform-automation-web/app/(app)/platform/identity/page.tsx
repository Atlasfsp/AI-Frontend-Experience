import { DataTable, DocsCodePanel, PageHeader } from '@bac/ui';

import { identityRows } from '@/features/data';

export default function IdentityPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Identity / Access Settings"
        title="Identity and access settings"
        description="Central platform view for workforce identity, authorization graph posture, and secret-backed control-plane access patterns."
      />
      <DataTable
        columns={[
          { header: 'Subject', render: (row) => row.subject },
          { header: 'Provider', render: (row) => row.provider },
          { header: 'Rotation', render: (row) => row.rotation },
          { header: 'Status', render: (row) => row.status },
        ]}
        rows={identityRows}
        title="Identity systems"
      />
      <DocsCodePanel
        tabs={[
          {
            content:
              'This page is the platform home for Authentik, SpiceDB, and future Vault-backed secret posture.\n\nIt intentionally separates identity settings from policy findings so operators can reason about access and compliance independently.',
            id: 'docs',
            label: 'Notes',
          },
        ]}
        title="Identity design note"
      />
    </div>
  );
}
