'use client';

import { useMemo, useState } from 'react';

import type { AgentSummary } from '@bac/api-clients';
import { Button, DetailList, DocsCodePanel, TerminalPanel, Timeline } from '@bac/ui';

import { getAgentDossier, type AgentActionRow } from '@/features/agent-operations';

export function AgentOperationsPanel({ agents }: { agents: AgentSummary[] }) {
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id ?? '');
  const [actionRows, setActionRows] = useState<Record<string, AgentActionRow[]>>(() =>
    Object.fromEntries(agents.map((agent) => [agent.id, getAgentDossier(agent.id).actionRows])),
  );

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedAgentId) ?? agents[0],
    [agents, selectedAgentId],
  );
  const dossier = selectedAgent ? getAgentDossier(selectedAgent.id) : null;

  function queueAction(action: string) {
    if (!selectedAgent) {
      return;
    }

    setActionRows((current) => ({
      ...current,
      [selectedAgent.id]: [
        {
          id: `${selectedAgent.id}-${Date.now()}`,
          action,
          owner: 'Operator',
          status: 'Queued',
          eta: 'Next scheduler tick',
        },
        ...(current[selectedAgent.id] ?? []),
      ],
    }));
  }

  if (!selectedAgent || !dossier) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Selected agent</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{selectedAgent.id}</h2>
          </div>
          <label className="flex min-w-[240px] flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.16em] text-slate-500">Routing target</span>
            <select
              className="h-11 rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-white outline-none transition focus:border-cyan-300/40"
              onChange={(event) => setSelectedAgentId(event.target.value)}
              value={selectedAgent.id}
            >
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.id} · {agent.service}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => queueAction(`Run health probe on ${selectedAgent.id}`)} variant="primary">
            Run health probe
          </Button>
          <Button onClick={() => queueAction(`Drain ${selectedAgent.id} after current assignment`)} variant="secondary">
            Schedule drain
          </Button>
          <Button onClick={() => queueAction(`Promote ${selectedAgent.id} to new model profile`)} variant="ghost">
            Promote model
          </Button>
        </div>
      </div>

      <DetailList
        title="Agent dossier"
        items={[
          { label: 'Service', value: selectedAgent.service },
          { label: 'Model', value: selectedAgent.model },
          { label: 'Status', value: selectedAgent.status },
          { label: 'Zone', value: dossier.zone },
          { label: 'Last heartbeat', value: dossier.lastHeartbeat, monospace: true },
          { label: 'Domains', value: dossier.assignedDomains.join(', ') },
        ]}
      />

      <Timeline title="Recent operational signals" items={dossier.timeline} />

      <DocsCodePanel
        title="Control guide"
        description="Use the action buttons to queue the next operational move, then follow the control guidance below for the selected agent."
        tabs={[
          {
            id: 'policy',
            label: 'Runtime policy',
            content: dossier.runtimePolicy,
          },
          {
            id: 'queue',
            label: 'Queued actions',
            kind: 'code',
            content: JSON.stringify(actionRows[selectedAgent.id] ?? [], null, 2),
          },
        ]}
      />

      <TerminalPanel title="Agent terminal" lines={dossier.terminalLines} />
    </div>
  );
}
