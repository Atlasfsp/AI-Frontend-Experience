'use client';

import React, { useEffect, useState, type FormEvent } from 'react';

type Connection = { id: string; repository: string; default_branch: string };
type ScopeKind = 'repository' | 'branch' | 'commit' | 'path' | 'orchestrator';
type Decision = { selection: { connection_id: string; scope: { kind: ScopeKind; reference?: string; path?: string } }; commit_sha: string; rationale: string };

export function SourceControlPanel() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionId, setConnectionId] = useState('');
  const [kind, setKind] = useState<ScopeKind>('repository');
  const [reference, setReference] = useState('');
  const [path, setPath] = useState('');
  const [decision, setDecision] = useState<Decision | null>(null);
  const [message, setMessage] = useState('Loading tenant repository connections…');
  const [configured, setConfigured] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch('/api/proxy/sdx/v1/source-control/connections', { headers: { accept: 'application/json' } })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!active) return;
        if (response.status === 503) {
          setConfigured(false);
          setMessage('No local repository connections are configured. An administrator can add operator-approved checkouts in the API manifest.');
          return;
        }
        if (!response.ok) throw new Error(typeof payload.error === 'string' ? payload.error : 'Repository connections could not be loaded.');
        const rows = Array.isArray(payload.connections) ? payload.connections as Connection[] : [];
        setConnections(rows);
        setConfigured(true);
        setConnectionId(rows[0]?.id ?? '');
        setMessage(rows.length ? '' : 'There are no repository connections configured for this tenant.');
      })
      .catch((error: unknown) => {
        if (active) setMessage(error instanceof Error ? error.message : 'Repository connections could not be loaded.');
      });
    return () => { active = false; };
  }, []);

  async function resolve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setDecision(null);
    const scope: Decision['selection']['scope'] = { kind };
    if (['branch', 'commit', 'path'].includes(kind) && reference.trim()) scope.reference = reference.trim();
    if (kind === 'path' && path.trim()) scope.path = path.trim();
    try {
      const response = await fetch('/api/proxy/sdx/v1/source-control/resolve', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ selection: { connection_id: connectionId, scope } }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof payload.error === 'string' ? payload.error : 'Source scope could not be resolved.');
      setDecision(payload as Decision);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Source scope could not be resolved.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="source-control-title" className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/10">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Engineer · Repository context</p>
      <h2 id="source-control-title" className="mt-2 text-xl font-semibold text-white">Choose the code scope</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">Resolve an approved repository, branch, commit, or path to an immutable Git SHA. This is a read-only scope check; it does not clone or execute code.</p>
      {connections.length > 0 ? (
        <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={resolve}>
          <label className="grid gap-2 text-sm font-medium text-slate-200">
            Repository
            <select className="min-h-11 rounded-xl border border-white/15 bg-slate-950 px-3 text-white" value={connectionId} onChange={(event) => setConnectionId(event.target.value)}>
              {connections.map((connection) => <option key={connection.id} value={connection.id}>{connection.repository} · default {connection.default_branch}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-200">
            Scope
            <select className="min-h-11 rounded-xl border border-white/15 bg-slate-950 px-3 text-white" value={kind} onChange={(event) => { setKind(event.target.value as ScopeKind); setDecision(null); }}>
              <option value="repository">Default branch</option><option value="branch">Branch or tag</option><option value="commit">Full commit SHA</option><option value="path">Path within a ref</option><option value="orchestrator">Let orchestrator choose during planning</option>
            </select>
          </label>
          {['branch', 'commit', 'path'].includes(kind) && <label className="grid gap-2 text-sm font-medium text-slate-200">{kind === 'commit' ? 'Commit SHA' : 'Branch or tag'}<input className="min-h-11 rounded-xl border border-white/15 bg-slate-950 px-3 text-white" value={reference} onChange={(event) => setReference(event.target.value)} required /></label>}
          {kind === 'path' && <label className="grid gap-2 text-sm font-medium text-slate-200">Repository-relative path<input className="min-h-11 rounded-xl border border-white/15 bg-slate-950 px-3 text-white" value={path} onChange={(event) => setPath(event.target.value)} placeholder="services/api" required /></label>}
          <div className="flex items-end"><button className="min-h-11 rounded-xl bg-cyan-300 px-5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60" disabled={busy || !connectionId}>{busy ? 'Resolving…' : 'Resolve immutable scope'}</button></div>
        </form>
      ) : null}
      {message && <p role="status" className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm leading-6 text-amber-50/90">{message}</p>}
      {configured && connections.length === 0 && !message && <p role="status" className="mt-5 text-sm text-slate-300">No repositories are connected for this tenant.</p>}
      {decision && <div className="mt-5 rounded-2xl border border-emerald-300/25 bg-emerald-300/5 p-4" role="status"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">Immutable source decision</p><code className="mt-2 block break-all text-sm text-white">{decision.commit_sha}</code><p className="mt-2 text-sm leading-6 text-slate-300">{decision.rationale}</p></div>}
    </section>
  );
}
