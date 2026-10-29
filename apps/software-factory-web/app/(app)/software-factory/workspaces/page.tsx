import Link from 'next/link';

import { hasPermission } from '@bac/auth';
import { PageHeader } from '@bac/ui';

import { listSharedEngineeringProjects } from '@/features/projects';
import { getServerSession } from '@/lib/session';
import { loadAppEnv } from '@/lib/env';

export default async function WorkspacesPage() {
  const session = await getServerSession();
  const canViewProjects = hasPermission(session, 'application:view');
  const result = canViewProjects
    ? await listSharedEngineeringProjects(loadAppEnv().hasuraUrl, session?.accessToken)
    : { status: 'unavailable' as const, reason: 'forbidden' as const };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Shared Engineering Projects"
        title="Projects"
        description="One tenant-scoped project record is shared by Create and Engineer, including the proposed application SME and engineering role council."
        actions={
          <Link className="rounded-full border border-cyan-300/30 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/10" href="/software-factory/prd-intake">
            Create a project
          </Link>
        }
      />
      {result.status === 'available' ? (
        result.projects.length ? (
          <ul aria-label="Engineering projects" className="grid gap-4 lg:grid-cols-2">
            {result.projects.map((project) => (
              <li key={project.id} className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/10">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">{project.applicationDomain}</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">{project.name}</h2>
                  </div>
                  <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">{project.status}</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-300">{project.outcome}</p>
                <dl className="mt-5 grid gap-3 border-t border-white/10 pt-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-400">Application SME</dt>
                    <dd className="mt-1 text-slate-100">{project.workforcePlan.expert?.name ?? 'Proposal unavailable'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Proposed role definitions</dt>
                    <dd className="mt-1 text-slate-100">{project.workforcePlan.roles?.length ?? 0}</dd>
                  </div>
                </dl>
                <p className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-3 text-xs leading-5 text-amber-50/90">
                  SME evidence: {project.workforcePlan.evidence_status ?? 'UNVERIFIED'}. No worker is activated and no code execution is authorized.
                </p>
                <p className="mt-4 break-all font-mono text-xs text-slate-400">Project ID: {project.id}</p>
                {project.repositoryRef ? <p className="mt-2 text-xs text-slate-400">Repository: {project.repositoryRef}</p> : <p className="mt-2 text-xs text-slate-400">No repository linked yet.</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 text-sm text-slate-300">No projects are visible in this tenant yet. Start in Create to propose an application and its SME council.</p>
        )
      ) : (
        <p role="status" className="rounded-3xl border border-amber-300/20 bg-amber-300/5 p-6 text-sm leading-6 text-amber-50/90">
          {result.reason === 'forbidden'
            ? 'Your account cannot view projects in this workspace.'
            : `Shared project reads are unavailable (${result.reason}). Configure the trusted Authentik Hasura claim mapping and apply the read-model metadata before this console can display projects. No local/demo projects are substituted.`}
        </p>
      )}
    </div>
  );
}
