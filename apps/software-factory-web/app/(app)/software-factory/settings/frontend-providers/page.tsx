import Link from 'next/link';

import { PageHeader } from '@bac/ui';

import {
  frontendProviderAuthority,
  getDeploymentProviderCandidates,
  getFrontendProviderCandidates,
} from '@/features/frontend-providers';

const capabilities: Record<string, string> = {
  design: 'Visual design',
  prototype: 'Prototyping',
  'design-context': 'Design context',
  'design-export': 'Reviewed export',
  'code-generation': 'Source generation',
  refactoring: 'Refactoring',
};

export default function FrontendProvidersPage() {
  const providers = getFrontendProviderCandidates();
  const deploymentTargets = getDeploymentProviderCandidates();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="FluxCore / Governed frontend providers"
        title="Frontend design and code platforms"
        description="Select providers by independently verified capabilities, tenant consent, data rights and budget. No single provider is compulsory, and a visual design is not proof of generated production source."
      />

      <section
        aria-label="Provider connection and release status"
        role="status"
        className="rounded-3xl border border-amber-400/30 bg-amber-500/10 p-5"
      >
        <h2 className="text-base font-semibold text-amber-100">
          No provider connection is authorized
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-amber-100/85">
          This is a source-only, not-yet-synced catalog. The backend provider
          registry, independent reviewer signatures, OAuth/Vault credentials,
          MCP tool discovery, protected egress, CI evidence and billable usage
          are not connected to this interface. Provider entries below are
          candidate capabilities, not verified service availability.
        </p>
        <p className="mt-3 text-xs font-medium tracking-wide text-amber-100/80">
          Source: {frontendProviderAuthority.sourceStatus} · Admission:{' '}
          {frontendProviderAuthority.gateStatus}
        </p>
      </section>

      <section aria-labelledby="provider-list-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="provider-list-heading"
              className="text-xl font-semibold text-white"
            >
              Approved categories for future connectors
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Stitch, Figma, v0, Designer2, and capability-approved providers
              can share a project without owning its repository or release
              authority.
            </p>
          </div>
          <Link
            href={frontendProviderAuthority.sourceLink}
            className="text-sm font-semibold text-cyan-200 underline underline-offset-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            Review architectural PR and source policy
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {providers.map((provider) => (
            <article
              key={provider.id}
              className="rounded-3xl border border-slate-700/70 bg-slate-900/70 p-6"
              aria-label={provider.name}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-slate-400">
                    {provider.id}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-white">
                    {provider.name}
                  </h3>
                </div>
                <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-100">
                  Not connected
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                {provider.notes}
              </p>
              <h4 className="mt-5 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Planned capability categories
              </h4>
              <ul
                className="mt-3 flex flex-wrap gap-2"
                aria-label={provider.name + ' intended capabilities'}
              >
                {provider.intendedCapabilities.map((capability) => (
                  <li
                    key={capability}
                    className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-200"
                  >
                    {capabilities[capability]}
                  </li>
                ))}
              </ul>
              <dl className="mt-5 grid gap-3 border-t border-slate-700/80 pt-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-400">Provider observation</dt>
                  <dd className="mt-1 font-mono text-xs text-white">
                    NOT_VERIFIED_LIVE
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Runtime integration</dt>
                  <dd className="mt-1 font-mono text-xs text-white">
                    NOT_CONNECTED
                  </dd>
                </div>
              </dl>
            </article>
          ))}
          <article
            className="rounded-3xl border border-dashed border-slate-600 bg-slate-950/40 p-6"
            aria-label="Additional frontend providers"
          >
            <p className="font-mono text-xs text-slate-400">
              CAPABILITY-BASED ONBOARDING
            </p>
            <h3 className="mt-1 text-lg font-semibold text-white">
              More design and frontend platforms
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Additional MCP or API providers can be added by capability.
              FluxCore checks each provider’s actual tools, tenant permissions,
              data rights, provenance, and budget before it is offered for a
              project.
            </p>
            <ul
              className="mt-4 flex flex-wrap gap-2"
              aria-label="Supported provider types"
            >
              <li className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-200">
                Design import
              </li>
              <li className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-200">
                Prototype context
              </li>
              <li className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-200">
                Code generation
              </li>
              <li className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-200">
                Refactoring
              </li>
            </ul>
            <p className="mt-4 text-xs text-amber-100">
              No automatic fallback between providers.
            </p>
          </article>
        </div>
      </section>

      <section
        aria-labelledby="deployment-targets-heading"
        className="space-y-4"
      >
        <div>
          <h2
            id="deployment-targets-heading"
            className="text-xl font-semibold text-white"
          >
            Deployment destinations
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-400">
            Design and code providers help create a project. A separate,
            reviewed release flow owns build evidence, deployment authorization,
            and rollback.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {deploymentTargets.map((target) => (
            <article
              key={target.id}
              className="rounded-3xl border border-slate-700/70 bg-slate-900/70 p-6"
              aria-label={target.name}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-slate-400">
                    {target.id.toUpperCase()}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-white">
                    {target.name}
                  </h3>
                </div>
                <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-100">
                  Not connected
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                {target.notes}
              </p>
              <p className="mt-4 text-xs text-slate-400">
                Intended targets: {target.intendedTargets.join(', ')} ·
                Deployment action: unavailable
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="provider-next-heading"
        className="space-y-3 rounded-3xl border border-slate-700/70 bg-slate-900/50 p-6"
      >
        <h2
          id="provider-next-heading"
          className="text-lg font-semibold text-white"
        >
          Admission and engineering sequence
        </h2>
        <ol className="list-inside list-decimal space-y-2 text-sm leading-relaxed text-slate-300">
          <li>
            Approve the external provider, its tool inventory and
            data-processing rights.
          </li>
          <li>
            Verify StratoID actor/tenant scope, signed independent consent and
            budget limits.
          </li>
          <li>
            Connect design and code tools only through a protected MCP/OpenShell
            gateway or approved native adapter; keep deployment adapters
            independent.
          </li>
          <li>
            Review actual design/code exports, provenance and software license
            rights.
          </li>
          <li>
            Integrate source in the existing frontend and run independent
            source-pinned CI before release.
          </li>
        </ol>
        <p className="pt-2 text-xs text-slate-400">
          This page is read-only. It cannot connect accounts, fetch secrets, run
          agents, charge providers or authorize deployment. The same project and
          Git repository remain canonical across Create, Engineer,
          provider-assisted design, and any future approved deployment target.
        </p>
        <Link
          href="/software-factory/settings"
          className="inline-block text-sm font-medium text-cyan-200 underline underline-offset-4"
        >
          Return to settings
        </Link>
      </section>
    </div>
  );
}
