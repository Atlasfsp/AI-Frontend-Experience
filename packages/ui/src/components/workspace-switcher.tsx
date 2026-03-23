'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';

import { Badge } from './badge';
import { Card } from './card';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface WorkspaceOption {
  description: string;
  environment?: string;
  id: string;
  label: string;
  status?: 'danger' | 'neutral' | 'success' | 'warning';
  tenant?: string;
}

export interface WorkspaceSwitcherProps {
  /** Current active workspace id from auth context. */
  activeWorkspaceId?: string;
  /** Compact mode shows only the selector and description. */
  compact?: boolean;
  /**
   * Called when the user selects a different workspace.
   * The parent is responsible for updating the session context,
   * invalidating queries, and redirecting to the dashboard.
   */
  onSwitch?: (workspaceId: string) => void | Promise<void>;
  /** Available workspaces to display in the dropdown. */
  options: WorkspaceOption[];
  /** Label above the selector. */
  title?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Workspace switcher component.
 * Dropdown that lists available workspaces for the current tenant.
 * Switching workspace updates the session context and reloads data.
 */
export function WorkspaceSwitcher({
  activeWorkspaceId,
  compact = false,
  onSwitch,
  options,
  title = 'Workspace',
}: WorkspaceSwitcherProps) {
  const [selectedId, setSelectedId] = useState(activeWorkspaceId ?? options[0]?.id ?? '');
  const [isPending, startTransition] = useTransition();

  const selected = useMemo(
    () => options.find((option) => option.id === selectedId) ?? options[0],
    [options, selectedId],
  );

  const isActive = selectedId === activeWorkspaceId;

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const nextId = event.target.value;
      setSelectedId(nextId);

      if (onSwitch && nextId !== activeWorkspaceId) {
        startTransition(() => {
          void Promise.resolve(onSwitch(nextId));
        });
      }
    },
    [activeWorkspaceId, onSwitch],
  );

  const selector = (
    <label className="flex flex-col gap-2 text-sm text-slate-300">
      <span className="text-xs uppercase tracking-[0.18em] text-slate-500">{title}</span>
      <select
        className="h-11 rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-white outline-none transition focus:border-cyan-300/40 disabled:opacity-50"
        disabled={isPending}
        onChange={handleChange}
        value={selected?.id ?? ''}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );

  if (compact) {
    return (
      <div className="min-w-[220px]">
        {selector}
        {selected ? (
          <div className="mt-2 flex items-center gap-2">
            <p className="text-xs text-slate-500">{selected.description}</p>
            {isPending ? (
              <span className="text-xs text-cyan-400">Switching...</span>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <Card className="space-y-4">
      {selector}
      {selected ? (
        <div className="rounded-[22px] border border-white/10 bg-slate-950/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-white">{selected.label}</p>
              <p className="mt-1 text-sm text-slate-300">{selected.description}</p>
            </div>
            <div className="flex items-center gap-2">
              {isPending ? (
                <Badge variant="warning">Switching...</Badge>
              ) : isActive ? (
                <Badge variant="success">Active</Badge>
              ) : null}
              {selected.status ? <Badge variant={selected.status}>{selected.status}</Badge> : null}
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Tenant</p>
              <p className="mt-1 text-sm text-white">{selected.tenant ?? 'Shared tenant'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Environment</p>
              <p className="mt-1 text-sm text-white">{selected.environment ?? 'Production-ready mock'}</p>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
