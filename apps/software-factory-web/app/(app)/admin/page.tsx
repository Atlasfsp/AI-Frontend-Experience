import Link from 'next/link';

import { Card, PageHeader } from '@bac/ui';

import { AgentGatewayConnectionPanel } from '@/components/agentgateway-connection-panel';

const adminAreas = [
  {
    description: 'Inspect local service health and the configured control-plane release identity.',
    href: '/admin/health',
    label: 'Platform health',
  },
  {
    description: 'Review the feature switches currently available to this environment.',
    href: '/admin/feature-flags',
    label: 'Feature flags',
  },
  {
    description: 'Manage who can use the platform and what each workspace role can do.',
    href: '/software-factory/settings/access',
    label: 'Identity and access',
  },
  {
    description: 'Review traceable events for approvals, releases, and contract activity.',
    href: '/software-factory/settings/audit',
    label: 'Audit trail',
  },
  {
    description: 'Inspect governed frontend design and code-generation providers.',
    href: '/software-factory/settings/frontend-providers',
    label: 'Frontend providers',
  },
];

export default function AdminConsolePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Platform administration"
        title="Admin console"
        description="Connect platform services, review access, and manage the controls that keep project work usable and governed."
      />

      <AgentGatewayConnectionPanel />

      <section aria-labelledby="admin-areas-heading" className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/75">
            Platform controls
          </p>
          <h2 id="admin-areas-heading" className="mt-2 text-xl font-semibold text-white">
            Other admin areas
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {adminAreas.map((area) => (
            <Card key={area.href} className="h-full">
              <Link className="group block h-full" href={area.href}>
                <h3 className="font-semibold text-white group-hover:text-cyan-100">{area.label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{area.description}</p>
                <span className="mt-4 inline-flex text-sm font-medium text-cyan-200">
                  Open settings <span aria-hidden="true" className="ml-2">→</span>
                </span>
              </Link>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
