import type { WorkspaceSummary } from '@bac/api-clients';
import type { TimelineItem } from '@bac/ui';

export interface WorkspaceActionRow {
  action: string;
  eta: string;
  id: string;
  owner: string;
  status: string;
}

export interface WorkspaceDossier {
  actionRows: WorkspaceActionRow[];
  claimStatus: string;
  deploymentWindow: string;
  environmentClass: string;
  memberCount: string;
  notes: string[];
  primaryRegion: string;
  quotaHeadroom: string;
  terminalLines: string[];
  timeline: TimelineItem[];
}

const dossiers: Record<string, WorkspaceDossier> = {
  'payments-core': {
    environmentClass: 'regulated-enterprise',
    memberCount: '42 members',
    primaryRegion: 'Nigeria',
    claimStatus: 'All critical promises claimed',
    quotaHeadroom: 'CPU 22% · Memory 19% · Storage 38%',
    deploymentWindow: '2026-03-22 20:00 UTC',
    notes: [
      'Release evidence must remain attached before any deployment freeze is lifted.',
      'Quota watch threshold is close enough that preview workloads should avoid this workspace.',
    ],
    actionRows: [
      {
        id: 'workspace-action-1',
        action: 'Queue access review for release operators',
        owner: 'Identity',
        status: 'Scheduled',
        eta: '15m',
      },
    ],
    timeline: [
      {
        actor: 'Workspace factory',
        title: 'Promise set reconciled',
        description: 'Identity, observability, and GitOps promises all reported healthy reconciliation.',
        status: 'success',
        time: '08:58 UTC',
      },
    ],
    terminalLines: [
      '$ bac workspaces inspect --workspace payments-core',
      'members .................... 42',
      'promises ................... 8 claimed',
      'quota_headroom ............. CPU 22% / Memory 19%',
      'deployment_window .......... 2026-03-22 20:00 UTC',
    ],
  },
  'retail-cloud': {
    environmentClass: 'shared-digital-retail',
    memberCount: '27 members',
    primaryRegion: 'Europe',
    claimStatus: 'One data-access promise under review',
    quotaHeadroom: 'CPU 31% · Memory 28% · Storage 41%',
    deploymentWindow: '2026-03-22 22:00 UTC',
    notes: [
      'Data-access promise review is holding back one analytics workload expansion.',
      'Regional drift is low, but deployment timing should stay outside the DR rehearsal.',
    ],
    actionRows: [
      {
        id: 'workspace-action-2',
        action: 'Freeze non-critical deployments during DR rehearsal',
        owner: 'Platform ops',
        status: 'Ready',
        eta: 'Window open',
      },
    ],
    timeline: [
      {
        actor: 'Platform ops',
        title: 'Quota watch cleared',
        description: 'Memory pressure dropped after one preview workload moved to staging.',
        status: 'neutral',
        time: '09:07 UTC',
      },
    ],
    terminalLines: [
      '$ bac workspaces inspect --workspace retail-cloud',
      'members .................... 27',
      'promises ................... 6 claimed / 1 review',
      'quota_headroom ............. CPU 31% / Memory 28%',
      'deployment_window .......... 2026-03-22 22:00 UTC',
    ],
  },
};

export function getWorkspaceDossier(workspaceId: string): WorkspaceDossier {
  return (
    dossiers[workspaceId] ?? {
      environmentClass: 'shared',
      memberCount: 'Unknown',
      primaryRegion: 'Unknown',
      claimStatus: 'Pending review',
      quotaHeadroom: 'Unknown',
      deploymentWindow: 'TBD',
      notes: ['No detailed dossier has been attached to this workspace yet.'],
      actionRows: [],
      timeline: [],
      terminalLines: [`$ bac workspaces inspect --workspace ${workspaceId}`],
    }
  );
}

export function summarizeWorkspaceEstate(workspaces: WorkspaceSummary[]) {
  const healthy = workspaces.filter((workspace) => workspace.status === 'healthy').length;
  const warning = workspaces.filter((workspace) => workspace.status === 'warning').length;
  const promises = workspaces.reduce((total, workspace) => total + workspace.promiseCount, 0);

  return {
    healthy,
    promises,
    warning,
  };
}
