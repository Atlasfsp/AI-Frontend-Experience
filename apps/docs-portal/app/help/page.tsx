import { Card, DataTable, PageHeader } from '@bac/ui';

const helpRows = [
  {
    id: 'frontend-shell',
    topic: 'Broken route or shell behavior',
    owner: 'Frontend Platform',
    provide: 'Affected route, auth mode, tenant, workspace, and whether the issue reproduces in mock mode.',
  },
  {
    id: 'api-contracts',
    topic: 'Contract mismatch or schema drift',
    owner: 'API Platform',
    provide: 'Expected endpoint or query, failing generated client seam, and sync command output.',
  },
  {
    id: 'auth-oidc',
    topic: 'Login or callback failure',
    owner: 'Security + Frontend Platform',
    provide: 'Issuer, redirect URI, callback path, cookie behavior, and any relevant browser/network errors.',
  },
  {
    id: 'platform-ops',
    topic: 'Platform control-plane signal issue',
    owner: 'Platform Automation',
    provide: 'Region, cluster, workspace, promise, or incident identifier plus the specific failing view.',
  },
] as const;

export default function HelpCenterPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Support"
        title="Help center"
        description="Start here when the docs answer is not enough. The goal is to route issues quickly with the context each owning team actually needs."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          {
            title: 'Before you escalate',
            body: 'Reproduce in mock mode if possible, record the exact route, and capture the command or action that triggered the failure.',
          },
          {
            title: 'When auth is involved',
            body: 'Note whether the issue occurs before login, during callback, or after session establishment. Cookie and redirect details matter.',
          },
          {
            title: 'When data is involved',
            body: 'Identify whether the failure lives in the app shell, BFF route, generated client seam, or the downstream contract itself.',
          },
        ].map((card) => (
          <Card key={card.title} className="space-y-3">
            <h2 className="text-lg font-semibold text-white">{card.title}</h2>
            <p className="text-sm text-slate-300">{card.body}</p>
          </Card>
        ))}
      </div>

      <DataTable
        title="Support routing guide"
        rows={helpRows.map((row) => ({ ...row }))}
        columns={[
          { header: 'Topic', render: (row) => row.topic },
          { header: 'Primary owner', render: (row) => row.owner },
          { header: 'Bring this context', render: (row) => row.provide },
        ]}
      />
    </div>
  );
}
