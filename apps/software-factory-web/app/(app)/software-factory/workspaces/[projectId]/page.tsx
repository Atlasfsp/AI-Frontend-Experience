import Link from 'next/link';
import { notFound } from 'next/navigation';

import { hasPermission } from '@bac/auth';
import { PageHeader } from '@bac/ui';

import { ProjectWorkspace } from '@/components/project-workspace';
import { getServerSession } from '@/lib/session';

const projectIdPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;

export default async function ProjectWorkspacePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await getServerSession();
  if (!session || !hasPermission(session, 'workspace:view') || !projectIdPattern.test(projectId)) notFound();

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="FluxCore Engineer · shared project"
        title="Project workspace"
        description="Link the repository, triage intake, and record plan, staffing and task decisions on the shared FluxCore project. Every action is saved by the FluxCore API; nothing is executed."
        actions={
          <Link
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
            href="/software-factory/workspaces"
          >
            All projects
          </Link>
        }
      />
      <ProjectWorkspace
        projectId={projectId}
        tenantId={session.tenantId}
        canManage={hasPermission(session, 'workspace:manage')}
        canApprove={hasPermission(session, 'approval:action')}
        subject={session.subject}
      />
    </div>
  );
}
