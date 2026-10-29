import Link from 'next/link';
import { notFound } from 'next/navigation';

import { hasPermission } from '@bac/auth';
import { PageHeader } from '@bac/ui';

import { ProjectWorkspace } from '@/components/project-workspace';
import { listSharedEngineeringProjects } from '@/features/projects';
import { loadAppEnv } from '@/lib/env';
import { getServerSession } from '@/lib/session';

export default async function ProjectWorkspacePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await getServerSession();
  if (!hasPermission(session, 'application:view')) notFound();

  const config = loadAppEnv();
  const result = await listSharedEngineeringProjects(
    config.hasuraUrl,
    `${config.sdxApiUrl.replace(/\/$/, '')}/v1/projects/read-authorization`,
    session?.accessToken,
  );
  const project = result.status === 'available'
    ? result.projects.find((item) => item.id === projectId)
    : undefined;

  if (!project) notFound();

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="FluxCore Engineer · shared project"
        title={project.name}
        description="Keep the product brief, design intent, engineering decisions, and future code changes together in one project workspace."
        actions={
          <Link
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
            href="/software-factory/workspaces"
          >
            All projects
          </Link>
        }
      />
      <ProjectWorkspace project={project} />
    </div>
  );
}
