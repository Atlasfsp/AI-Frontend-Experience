import { DataTable, DocsCodePanel, PageHeader } from '@bac/ui';

import { accessRows } from '@/features/data';

export default function AccessSettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Access Settings"
        title="Identity and access settings"
        description="Role-aware principal management aligned to Authentik authentication, workspace scopes, and future SpiceDB-backed authorization flows."
      />
      <DataTable
        columns={[
          { header: 'Principal', render: (row) => row.principal },
          { header: 'Role', render: (row) => row.role },
          { header: 'Scope', render: (row) => row.scope },
          { header: 'Status', render: (row) => row.status },
        ]}
        rows={accessRows}
        title="Workspace access"
      />
      <DocsCodePanel
        tabs={[
          {
            content:
              'Access configuration is intentionally modeled as a page system instead of a single form so role, scope, audit, and approval views can evolve independently.\n\nThis route is the future home for group sync, access requests, and break-glass flows.',
            id: 'docs',
            label: 'Notes',
          },
        ]}
        title="Access design note"
      />
    </div>
  );
}
