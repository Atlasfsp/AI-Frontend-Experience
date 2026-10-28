import Link from 'next/link';

import { DetailList, PageHeader } from '@bac/ui';

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Settings"
        title="Settings, access, and audit"
        description="Administration overview for identity, access posture, audit traces, and the operator conventions that shape how work moves through the software factory."
      />
      <DetailList
        items={[
          {
            hint: 'Manage principal scopes, workspace roles, and operator membership.',
            label: 'Access controls',
            value: (
              <Link className="text-cyan-100 underline decoration-cyan-300/40 underline-offset-4" href="/software-factory/settings/access">
                Open access settings
              </Link>
            ),
          },
          {
            hint: 'Review events linked to contract, release, and approval activity.',
            label: 'Audit trail',
            value: (
              <Link className="text-cyan-100 underline decoration-cyan-300/40 underline-offset-4" href="/software-factory/settings/audit">
                Open audit view
              </Link>
            ),
          },
          {
            hint: 'Review v0, Designer2, Stitch, Figma and proposed future MCP tool connections without enabling external processing.',
            label: 'Frontend provider catalog',
            value: (
              <Link className="text-cyan-100 underline decoration-cyan-300/40 underline-offset-4" href="/software-factory/settings/frontend-providers">
                Review provider connection posture
              </Link>
            ),
          },
          {
            hint: 'Prepared for future integration with shared identity and policy services.',
            label: 'Long-term posture',
            value: 'Extensible settings surface',
          },
        ]}
        title="Administration surfaces"
      />
    </div>
  );
}
