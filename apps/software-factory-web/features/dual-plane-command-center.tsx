import Link from 'next/link';

import type { AgentSummary, BuildSummary, WorkItemSummary } from '@bac/api-clients';

import type { FactorySourceLabel } from './telemetry-provenance';

type Props = {
  agents: AgentSummary[];
  builds: BuildSummary[];
  workItems: WorkItemSummary[];
  source: FactorySourceLabel;
};

function ReadinessTile({
  name,
  value,
  caveat,
}: {
  name: string;
  value: string;
  caveat: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{name}</div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
      <div className="mt-1 text-xs leading-relaxed text-slate-400">{caveat}</div>
    </div>
  );
}

/**
 * Source-labelled factory operations and application delivery planes.
 * The current API does NOT provide independent signed CI, model-cost or
 * deployment attestations. Never silently synthesize those values.
 */
export function DualPlaneCommandCenter({ agents, builds, workItems, source }: Props) {
  const isDemo = source.mode === 'DEMO';
  const label = isDemo ? 'Sample records' : 'API-reported records — unverified';

  return (
    <section aria-label="Dual-plane AI Factory command center" className="space-y-5">
      <div role="status" className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-5">
        <div className="text-sm font-semibold text-amber-100">{source.headline}</div>
        <p className="mt-1 text-sm text-amber-200/80">{source.caution}</p>
        <p className="mt-2 text-xs text-slate-300">
          Independent evidence contract: FACTORY-004. Live CI signatures, release permissions and preview registry are not connected.
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <section aria-labelledby="factory-operations-heading" className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/70 p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">Plane 1 · AI brain</p>
            <h2 id="factory-operations-heading" className="mt-1 text-xl font-semibold text-white">Factory Operations</h2>
            <p className="mt-1 text-sm text-slate-300">
              OpenHands agent progress, bounded repair, model selection, task throughput and cost.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ReadinessTile name="Agent registry" value={String(agents.length)}
              caveat={label + '; not independently attested OpenShell sessions'} />
            <ReadinessTile name="Task backlog" value={String(workItems.length)}
              caveat={label + '; not a GitHub Issues synchronization receipt'} />
            <ReadinessTile name="Model spend / tokens" value="Not connected"
              caveat="Requires approved FluxCore usage and cost-per-accepted-task telemetry" />
            <ReadinessTile name="OpenHands session stream" value="Not verified"
              caveat="Requires governed Agent Server, Authentik RBAC and OpenShell audit events" />
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link className="text-cyan-300 underline underline-offset-4" href="/software-factory/agents">Agent mesh</Link>
            <Link className="text-cyan-300 underline underline-offset-4" href="/software-factory/work-items">Work queue</Link>
            <Link className="text-cyan-300 underline underline-offset-4" href="/software-factory/activity">Recorded activity</Link>
          </div>
        </section>
        <section aria-labelledby="app-delivery-heading" className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/70 p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">Plane 2 · Shipped code</p>
            <h2 id="app-delivery-heading" className="mt-1 text-xl font-semibold text-white">Application Delivery</h2>
            <p className="mt-1 text-sm text-slate-300">
              Independent CI builds, signed evidence, previews, staging health and controlled releases.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ReadinessTile name="Build records" value={String(builds.length)}
              caveat={label + '; not verified Jenkins/Tekton results'} />
            <ReadinessTile name="Signed CI pass / release" value="Not connected"
              caveat="Require full commit SHA, trusted runner, immutable log/artifact and signed admission" />
            <ReadinessTile name="Preview / APK / TestFlight" value="Unavailable"
              caveat="No authenticated tenant-scoped TTL preview registry attached" />
            <ReadinessTile name="Staging / production health" value="Unverified"
              caveat="Require signed deployment marker, OTel error/latency and independent review" />
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link className="text-cyan-300 underline underline-offset-4" href="/software-factory/builds">Build history</Link>
            <Link className="text-cyan-300 underline underline-offset-4" href="/software-factory/settings">Release controls</Link>
          </div>
        </section>
      </div>
      <p className="text-xs text-slate-400">
        Gate flow: PR → independent lint/build/unit/integration/security/package → signed evidence
        → approved preview → QA → separate staging/production authorization → OTel rollback signals.
        A passing agent session never authorizes deployment.
      </p>
    </section>
  );
}
