'use client';

import { useMemo, useState } from 'react';

import { Badge } from './badge';
import { Card } from './card';

export interface WorkspaceOption {
  description: string;
  environment?: string;
  id: string;
  label: string;
  status?: 'danger' | 'neutral' | 'success' | 'warning';
  tenant?: string;
}

export function WorkspaceSwitcher({
  compact = false,
  options,
  title = 'Workspace',
}: {
  compact?: boolean;
  options: WorkspaceOption[];
  title?: string;
}) {
  const [selectedId, setSelectedId] = useState(options[0]?.id ?? '');
  const selected = useMemo(
    () => options.find((option) => option.id === selectedId) ?? options[0],
    [options, selectedId],
  );

  const selector = (
    <label className="flex flex-col gap-2 text-sm text-slate-300">
      <span className="text-xs uppercase tracking-[0.18em] text-slate-500">{title}</span>
      <select
        className="h-11 rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-white outline-none transition focus:border-cyan-300/40"
        onChange={(event) => setSelectedId(event.target.value)}
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
          <p className="mt-2 text-xs text-slate-500">{selected.description}</p>
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
            {selected.status ? <Badge variant={selected.status}>{selected.status}</Badge> : null}
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
