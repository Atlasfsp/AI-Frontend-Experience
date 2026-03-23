'use client';

import { useMemo, useState } from 'react';

import type { WorkspaceSummary } from '@bac/api-clients';
import { Button, DetailList, DocsCodePanel, TerminalPanel, Timeline } from '@bac/ui';

import { getWorkspaceDossier, type WorkspaceActionRow } from '@/features/workspace-operations';

export function WorkspaceOperationsPanel({ workspaces }: { workspaces: WorkspaceSummary[] }) {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(workspaces[0]?.id ?? '');
  const [actionRows, setActionRows] = useState<Record<string, WorkspaceActionRow[]>>(() =>
    Object.fromEntries(workspaces.map((workspace) => [workspace.id, getWorkspaceDossier(workspace.id).actionRows])),
  );

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? workspaces[0],
    [selectedWorkspaceId, workspaces],
  );
  const dossier = selectedWorkspace ? getWorkspaceDossier(selectedWorkspace.id) : null;

  function queueAction(action: string) {
    if (!selectedWorkspace) {
      return;
    }

    setActionRows((current) => ({
      ...current,
      [selectedWorkspace.id]: [
        {
          id: `${selectedWorkspace.id}-${Date.now()}`,
          action,
          owner: 'Operator',
          status: 'Queued',
          eta: 'Next control loop',
        },
        ...(current[selectedWorkspace.id] ?? []),
      ],
    }));
  }

  if (!selectedWorkspace || !dossier) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Selected workspace</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{selectedWorkspace.id}</h2>
          </div>
          <label className="flex min-w-[240px] flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.16em] text-slate-500">Estate selector</span>
            <select
              className="h-11 rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-white outline-none transition focus:border-cyan-300/40"
              onChange={(event) => setSelectedWorkspaceId(event.target.value)}
              value={selectedWorkspace.id}
            >
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.id} · {workspace.tenant}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => queueAction(`Queue access review for ${selectedWorkspace.id}`)} variant="primary">
            Queue access review
          </Button>
          <Button onClick={() => queueAction(`Freeze deployments in ${selectedWorkspace.id}`)} variant="secondary">
            Freeze deployments
          </Button>
          <Button onClick={() => queueAction(`Expand promise set in ${selectedWorkspace.id}`)} variant="ghost">
            Expand promise set
          </Button>
        </div>
      </div>

      <DetailList
        title="Workspace dossier"
        items={[
          { label: 'Tenant', value: selectedWorkspace.tenant },
          { label: 'Status', value: selectedWorkspace.status },
          { label: 'Promise count', value: selectedWorkspace.promiseCount.toString() },
          { label: 'Environment class', value: dossier.environmentClass },
          { label: 'Primary region', value: dossier.primaryRegion },
          { label: 'Member count', value: dossier.memberCount },
          { label: 'Quota headroom', value: dossier.quotaHeadroom },
          { label: 'Deployment window', value: dossier.deploymentWindow },
        ]}
      />

      <Timeline title="Recent workspace activity" items={dossier.timeline} />

      <DocsCodePanel
        title="Operational notes"
        description="The action queue below reflects the current workspace selection and gives operators a lightweight control-center loop without leaving the estate screen."
        tabs={[
          {
            id: 'notes',
            label: 'Notes',
            content: dossier.notes.join('\n\n'),
          },
          {
            id: 'queue',
            label: 'Queued actions',
            kind: 'code',
            content: JSON.stringify(actionRows[selectedWorkspace.id] ?? [], null, 2),
          },
        ]}
      />

      <TerminalPanel title="Workspace terminal" lines={dossier.terminalLines} />
    </div>
  );
}
