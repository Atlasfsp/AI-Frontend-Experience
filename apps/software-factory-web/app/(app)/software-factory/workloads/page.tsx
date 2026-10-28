import Link from 'next/link';

import { PageHeader } from '@bac/ui';

import { unconnectedWorkloadRegistry, workloadKinds } from '@/features/workload-registry';

const descriptions: Record<(typeof workloadKinds)[number], { label: string; detail: string }> = {
  engineering_job: {
    label: 'Engineering execution',
    detail: 'Scoped issues, DAG tasks, worktrees, agent sessions, budgets and independent reviews.',
  },
  ci_build: {
    label: 'Independent build & verification',
    detail: 'Jenkins/Tekton runs, test gates, immutable packages and signed CI provenance.',
  },
  preview: {
    label: 'Preview and staging candidates',
    detail: 'Short-lived, tenant-authorized web/mobile/container previews with TTL and rollout state.',
  },
  runtime_service: {
    label: 'Running services',
    detail: 'Deployed containers, VMs and APIs, by environment, SLO, release, region and owner.',
  },
  data_infra: {
    label: 'Data and infrastructure',
    detail: 'Database migrations, worker fleets and network/control-plane change workloads.',
  },
};

export default function WorkloadsPage() {
  const registry = unconnectedWorkloadRegistry();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="FluxCore / Factory control plane"
        title="Workload command center"
        description="The factory's own executable jobs, builds, preview environments and deployed services — never guessed pages inside future customer applications."
      />

      <section aria-label="Workload data availability" role="status"
        className="rounded-3xl border border-amber-400/30 bg-amber-500/10 p-5">
        <p className="text-base font-semibold text-amber-100">
          Workload registry not connected
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-amber-100/80">
          Source-only interface. No signed workload BFF, execution scheduler, preview registry,
          runtime metering or independent environment data is connected. No fabricated
          workloads, counts, costs, CI passes or deployment authorizations are displayed.
        </p>
        <p className="mt-3 text-xs font-medium tracking-wide text-slate-300">
          Current source: NOT_CONNECTED · release authority: DENIED
        </p>
      </section>

      <section aria-label="Workload families" className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Workload families</h2>
          <p className="mt-1 text-sm text-slate-400">
            These are supported contract categories, not discovered running workloads.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workloadKinds.map((kind) => (
            <div key={kind} className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <div className="text-xs uppercase tracking-wide text-cyan-300">{kind.replaceAll('_', ' ')}</div>
              <h3 className="mt-2 font-semibold text-white">{descriptions[kind].label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{descriptions[kind].detail}</p>
              <div className="mt-4 text-xs text-amber-200">Records unavailable · requires trusted integration</div>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Workload monitoring prerequisites" className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
        <h2 className="text-lg font-semibold text-white">Required operational connections</h2>
        <p className="mt-1 text-sm text-slate-400">These are engineering gates, not active services.</p>
        <ul className="mt-4 space-y-2">
          {registry.integrationRequirements.map((requirement) => (
            <li key={requirement} className="flex gap-2 text-sm text-slate-300">
              <span aria-hidden="true" className="text-amber-300">○</span>
              <span>{requirement}</span>
            </li>
          ))}
        </ul>
      </section>

      <nav aria-label="Related factory views" className="flex flex-wrap gap-3 text-sm">
        <Link href="/software-factory/work-items" className="rounded-full border border-white/20 px-4 py-2 text-cyan-300 hover:bg-white/5">
          Work item intake
        </Link>
        <Link href="/software-factory/builds" className="rounded-full border border-white/20 px-4 py-2 text-cyan-300 hover:bg-white/5">
          Build history
        </Link>
        <Link href="/software-factory/dashboard" className="rounded-full border border-white/20 px-4 py-2 text-cyan-300 hover:bg-white/5">
          Factory command dashboard
        </Link>
        <Link href="/software-factory/release-manager" className="rounded-full border border-white/20 px-4 py-2 text-cyan-300 hover:bg-white/5">
          Release manager
        </Link>
      </nav>
    </div>
  );
}
