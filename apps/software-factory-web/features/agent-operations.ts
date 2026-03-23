import type { AgentSummary } from '@bac/api-clients';
import type { TimelineItem } from '@bac/ui';

export interface AgentActionRow {
  action: string;
  eta: string;
  id: string;
  owner: string;
  status: string;
}

export interface AgentOperationsDossier {
  actionRows: AgentActionRow[];
  assignedDomains: string[];
  lastHeartbeat: string;
  runtimePolicy: string;
  terminalLines: string[];
  timeline: TimelineItem[];
  zone: string;
}

const dossiers: Record<string, AgentOperationsDossier> = {
  'agent-1': {
    zone: 'ng-prod / planner pool',
    lastHeartbeat: '2026-03-22T09:21:00.000Z',
    runtimePolicy: 'High-context planning, bounded parallelism, release-aware scheduling',
    assignedDomains: ['PRD intake', 'release scheduling', 'workspace planning'],
    actionRows: [
      {
        id: 'action-1',
        action: 'Queue high-priority release planning lane',
        owner: 'Release manager',
        status: 'Queued',
        eta: '2m',
      },
    ],
    timeline: [
      {
        actor: 'Planner mesh',
        title: 'Priority lane rebalanced',
        description: 'Planner pool moved one high-context stream onto a release-protected lane.',
        status: 'success',
        time: '09:12 UTC',
      },
    ],
    terminalLines: [
      '$ bac agents inspect --agent agent-1',
      'model ...................... gpt-5.4',
      'queue_depth ............... 4',
      'cpu_budget ................ healthy',
      'next_action ............... maintain planner headroom',
    ],
  },
  'agent-2': {
    zone: 'eu-prod / reviewer pool',
    lastHeartbeat: '2026-03-22T09:18:00.000Z',
    runtimePolicy: 'Strict reviewer gating, diff-heavy validation, policy evidence attachment',
    assignedDomains: ['ADR review', 'contract review', 'quality gates'],
    actionRows: [
      {
        id: 'action-2',
        action: 'Drain after current review to apply updated policy pack',
        owner: 'Quality mesh',
        status: 'Scheduled',
        eta: '12m',
      },
    ],
    timeline: [
      {
        actor: 'Quality mesh',
        title: 'Reviewer saturation warning',
        description: 'Reviewer queue depth crossed the warning threshold during a release surge.',
        status: 'warning',
        time: '09:05 UTC',
      },
    ],
    terminalLines: [
      '$ bac agents inspect --agent agent-2',
      'model ...................... gpt-5.4-mini',
      'queue_depth ............... 9',
      'policy_pack ............... pending refresh',
      'next_action ............... drain after current review',
    ],
  },
  'agent-3': {
    zone: 'za-prod / writer pool',
    lastHeartbeat: '2026-03-22T09:10:00.000Z',
    runtimePolicy: 'Artifact generation, docs synthesis, contract-aware output formatting',
    assignedDomains: ['docs portal', 'code panels', 'release evidence'],
    actionRows: [
      {
        id: 'action-3',
        action: 'Promote writer pool to new model profile',
        owner: 'Frontend platform',
        status: 'Ready',
        eta: 'Window open',
      },
    ],
    timeline: [
      {
        actor: 'Writer mesh',
        title: 'Model promotion rehearsal complete',
        description: 'Preview rollout verified output quality for docs and evidence generation tasks.',
        status: 'neutral',
        time: '08:56 UTC',
      },
    ],
    terminalLines: [
      '$ bac agents inspect --agent agent-3',
      'model ...................... gpt-5.3-codex',
      'queue_depth ............... 1',
      'promotion_window .......... open',
      'next_action ............... canary one writer instance',
    ],
  },
};

export function getAgentDossier(agentId: string): AgentOperationsDossier {
  return (
    dossiers[agentId] ?? {
      zone: 'shared-ops',
      lastHeartbeat: new Date().toISOString(),
      runtimePolicy: 'Fallback operational policy',
      assignedDomains: ['shared routing'],
      actionRows: [],
      timeline: [],
      terminalLines: [
        `$ bac agents inspect --agent ${agentId}`,
        'model ...................... unknown',
        'queue_depth ............... n/a',
      ],
    }
  );
}

export function summarizeAgentMesh(agents: AgentSummary[]) {
  const healthy = agents.filter((agent) => agent.status === 'healthy').length;
  const working = agents.filter((agent) => agent.status === 'working').length;
  const idle = agents.filter((agent) => agent.status === 'idle').length;

  return {
    healthy,
    idle,
    working,
  };
}
