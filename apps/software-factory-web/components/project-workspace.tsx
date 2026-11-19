'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';

import { callFluxCore, describeFailure, FluxCoreApiError, IdempotencyKeys, isOutcomeUnconfirmed } from '@/lib/fluxcore-api';
import { beginWriteFence, isWriteFenceBlocked, ownsWriteFence, scopedWriteFenceKey, settleWriteFence, type WriteFence } from '@/lib/release0-write-fence';

type Project = {
  id: string;
  tenant_id: string;
  name: string;
  outcome: string;
  application_domain: string;
  repository_ref?: string;
  version: number;
  status: string;
  workforce_plan?: { expert?: { name?: string }; evidence_status?: string };
};
type Connection = { id: string; repository: string; default_branch: string };
type ScopeKind = 'repository' | 'branch' | 'commit' | 'path';
type Selection = { connection_id: string; scope: { kind: ScopeKind; reference?: string; path?: string } };
type Intake = {
  intake_id: string;
  project_id?: string;
  title?: string;
  triage_state: 'PENDING_TRIAGE' | 'QUARANTINED_REQUIRES_REVIEW' | 'ACCEPTED' | 'REJECTED';
  version?: number;
  warning?: string;
};
type Stage = { stage_id: string; title: string; risk_tier: string; requires_human_approval: boolean; capability?: string; depends_on?: string[] };
type Plan = {
  plan_id: string;
  intake_id: string;
  status: 'DRAFT' | 'APPROVED' | 'REJECTED';
  project_version: number;
  requested_by?: string;
  decided_by?: string;
  decided_at?: string;
  decision_reason?: string;
  plan: { commit_sha: string; stages: Stage[] };
};
type Proposal = {
  team_id: string;
  project_version: number;
  engineering_plan_id?: string;
  requested_by?: string;
  decision_status: 'PROPOSED' | 'APPROVED' | 'REJECTED';
  decided_by?: string;
  decision_reason?: string;
  activation_state: string;
  execution_readiness: { blocked_reasons: string[] };
  team: { members?: Array<{ role_id?: string; title?: string }> };
};
type Task = {
  task_id: string;
  plan_id: string;
  stage_id?: string;
  title: string;
  capability?: string;
  risk_tier: string;
  depends_on?: string[];
  requires_human_approval?: boolean;
  status: 'OPEN' | 'CANCELLED';
  state: string;
  blocked_reasons: string[];
  execution_blocked_reasons?: string[];
  dispatch_state?: string;
  assigned_role_title?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  cancel_reason?: string;
};
type DecisionEvent = {
  project_version: number;
  event_kind: string;
  resource_id: string;
  from_state: string;
  to_state: string;
  actor_subject: string;
  reason: string;
  recorded_at: string;
};
type AuditPage = {
  rows: DecisionEvent[];
  next: number | null;
  coverage: string | undefined;
  legacyHistory: string | undefined;
  verification: string | undefined;
};
type Section<T> = { status: 'loading' } | { status: 'ready'; value: T } | { status: 'error'; message: string };
type PendingCommand = { scope: string; success: string; method: 'POST' | 'PUT'; path: string; body: Record<string, unknown>; key: string };

const hexCommit = /^([0-9a-fA-F]{40}|[0-9a-fA-F]{64})$/;
const card = 'rounded-3xl border border-white/10 bg-slate-900/70 p-5 sm:p-6';
const field = 'min-h-11 w-full rounded-xl border border-white/15 bg-slate-950 px-3 text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300';
const primary = 'min-h-11 rounded-xl bg-cyan-300 px-4 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50';
const secondary = 'min-h-11 rounded-xl border border-white/20 px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50';
const auditPageSize = 100;

type DecisionEventsPayload = {
  decision_events: DecisionEvent[];
  next_after_project_version?: number | null;
  coverage?: string;
  legacy_history?: string;
  independent_verification?: string;
};

function toAuditPage(data: DecisionEventsPayload): AuditPage | undefined {
  if (!Array.isArray(data.decision_events)) return undefined;
  const next = data.next_after_project_version;
  return {
    rows: data.decision_events,
    next: Number.isInteger(next) ? (next as number) : null,
    coverage: data.coverage,
    legacyHistory: data.legacy_history,
    verification: data.independent_verification,
  };
}

/**
 * FluxCore refuses decisions by the recorded requester and on records without a
 * recorded requester (separation cannot be proven). The UI explains these cases
 * instead of offering a form that cannot succeed; the backend stays authoritative.
 */
function decisionBlocker(requestedBy: string | undefined, subject: string | undefined, noun: 'plan' | 'team') {
  if (!requestedBy?.trim()) return `This ${noun} has no recorded requester, so FluxCore cannot accept a decision on it.`;
  if (subject && requestedBy === subject) {
    return noun === 'plan'
      ? 'You requested this plan. A different person must record the decision.'
      : 'You proposed this team. A different person must record the decision.';
  }
  return null;
}

/** Returns a user-facing problem with a source selection, or null when it matches the source-control scope contract. */
export function validateSelection(selection: Selection): string | null {
  if (!selection.connection_id) return 'Choose a configured repository connection.';
  const { kind, reference, path } = selection.scope;
  if ((kind === 'branch' || kind === 'path') && !reference) return 'Enter a branch or tag.';
  if (reference && reference.length > 255) return 'The reference must be 255 characters or fewer.';
  if (kind === 'commit' && !hexCommit.test(reference ?? '')) return 'Enter a full 40 or 64 character commit SHA.';
  if (kind === 'path') {
    if (!path) return 'Enter a repository-relative path.';
    if (path.length > 1024 || path.startsWith('/') || path.includes('\\') || /^[A-Za-z]:/.test(path) || path.split('/').includes('..')) {
      return 'Use a path inside the repository, such as services/api. Absolute and parent paths are refused.';
    }
  }
  return null;
}

function buildSelection(connectionId: string, kind: ScopeKind, reference: string, path: string): Selection {
  const scope: Selection['scope'] = { kind };
  if (kind !== 'repository' && reference.trim()) scope.reference = reference.trim();
  if (kind === 'path' && path.trim()) scope.path = path.trim();
  return { connection_id: connectionId, scope };
}

function isProject(value: unknown, projectId: string, tenantId: string): value is Project {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return row.id === projectId && row.tenant_id === tenantId && typeof row.name === 'string' && Number.isInteger(row.version) && (row.version as number) > 0;
}

function DecisionForm({
  label,
  options,
  disabled,
  requireAcknowledgement,
  onSubmit,
}: {
  label: string;
  options: readonly [string, string];
  disabled: boolean;
  requireAcknowledgement?: boolean;
  onSubmit: (decision: string, reason: string, acknowledged: boolean) => Promise<boolean>;
}) {
  const [decision, setDecision] = useState<string>(options[0]);
  const [reason, setReason] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const blocked = disabled || !reason.trim() || reason.length > 2000 || (requireAcknowledgement && decision === options[0] && !acknowledged);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await onSubmit(decision, reason.trim(), acknowledged)) setReason('');
  }
  return (
    <form aria-label={label} className="mt-3 grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)_auto]" onSubmit={submit}>
      <label className="text-xs text-slate-300">
        Decision
        <select className={field} value={decision} onChange={(event) => setDecision(event.target.value)}>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
      <label className="text-xs text-slate-300">
        Reason
        <input className={field} maxLength={2000} value={reason} onChange={(event) => setReason(event.target.value)} required />
      </label>
      <button className={`${primary} self-end`} disabled={blocked} type="submit">Record decision</button>
      {requireAcknowledgement && (
        <label className="flex items-center gap-2 text-xs text-amber-100 sm:col-span-3">
          <input checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} type="checkbox" />
          I reviewed the heuristic warning on this quarantined intake.
        </label>
      )}
    </form>
  );
}

function SectionStatus<T>({ section, empty, children }: { section: Section<T>; empty: boolean; children: (value: T) => React.ReactNode }) {
  if (section.status === 'loading') return <p className="mt-3 text-sm text-slate-400">Loading…</p>;
  if (section.status === 'error') return <p role="status" className="mt-3 text-sm text-amber-100">{section.message}</p>;
  if (empty) return <p className="mt-3 text-sm text-slate-400">Nothing recorded yet.</p>;
  return <>{children(section.value)}</>;
}

export function ProjectWorkspace({
  projectId,
  tenantId,
  canManage,
  canApprove,
  subject,
}: {
  projectId: string;
  tenantId: string;
  canManage: boolean;
  canApprove: boolean;
  subject?: string;
}) {
  const keys = useRef(new IdempotencyKeys());
  const scope = JSON.stringify([subject, tenantId, projectId]);
  const [fenceBinding, setFenceBinding] = useState<{ scope: string; key: string } | null>(null);
  const [fenceBlocked, setFenceBlocked] = useState(false);
  const ownedFence = useRef<WriteFence | null>(null);
  const [project, setProject] = useState<Section<Project>>({ status: 'loading' });
  const [intakes, setIntakes] = useState<Section<Intake[]>>({ status: 'loading' });
  const [plans, setPlans] = useState<Section<Plan[]>>({ status: 'loading' });
  const [proposals, setProposals] = useState<Section<Proposal[]>>({ status: 'loading' });
  const [tasks, setTasks] = useState<Section<Task[]>>({ status: 'loading' });
  const [events, setEvents] = useState<Section<AuditPage>>({ status: 'loading' });
  const [auditMore, setAuditMore] = useState<'idle' | 'loading' | 'failed'>('idle');
  const [connections, setConnections] = useState<Section<Connection[]>>({ status: 'loading' });
  const [working, setWorking] = useState(false);
  const workingRef = useRef(false);
  const activeCommand = useRef<Omit<PendingCommand, 'success'> | null>(null);
  const [pendingCommand, setPendingCommand] = useState<PendingCommand | null>(null);
  const currentPending = pendingCommand?.scope === scope ? pendingCommand : null;
  const fenceReady = fenceBinding?.scope === scope;
  const busy = working || currentPending !== null || !fenceReady || fenceBlocked;
  const [notice, setNotice] = useState('');
  const [failure, setFailure] = useState('');

  const pid = encodeURIComponent(projectId);
  const tid = encodeURIComponent(tenantId);

  useEffect(() => {
    let live = true;
    let observedKey: string | null = null;
    const onStorage = (event: StorageEvent) => {
      if ((event.key === observedKey || event.key === null) && observedKey) {
        setFenceBlocked(isWriteFenceBlocked(observedKey) && !(ownedFence.current && ownsWriteFence(ownedFence.current)));
      }
    };
    // A principal/scope change cannot inherit another person's retry key or
    // payload. An unresolved prior scope stays fenced in browser storage.
    ownedFence.current = null;
    keys.current = new IdempotencyKeys();
    void scopedWriteFenceKey(subject, tenantId, projectId).then((key) => {
      if (!live) return;
      observedKey = key;
      setFenceBlocked(isWriteFenceBlocked(key));
      setFenceBinding({ scope, key });
      window.addEventListener('storage', onStorage);
    }).catch(() => {
      if (live) setFenceBlocked(true); // Missing principal/WebCrypto: deny writes.
    });
    return () => {
      live = false;
      window.removeEventListener('storage', onStorage);
    };
  }, [subject, tenantId, projectId, scope]);

  const load = useCallback(async () => {
    const read = <T,>(path: string) => callFluxCore<T>('GET', path);
    const [p, i, pl, tp, t, e, c] = await Promise.allSettled([
      read<unknown>(`v1/projects/${pid}?tenant_id=${tid}`),
      read<{ intakes: Intake[] }>(`v1/control-plane/intake?tenant_id=${tid}&project_id=${pid}&limit=100`),
      read<{ engineering_plans: Plan[] }>(`v1/projects/${pid}/engineering-plans?tenant_id=${tid}`),
      read<{ staffing_proposals: Proposal[] }>(`v1/projects/${pid}/team-proposals?tenant_id=${tid}`),
      read<{ engineering_tasks: Task[] }>(`v1/projects/${pid}/engineering-tasks?tenant_id=${tid}`),
      read<DecisionEventsPayload>(`v1/projects/${pid}/decision-events?tenant_id=${tid}&limit=${auditPageSize}`),
      canManage ? read<{ connections: Connection[] }>('v1/source-control/connections') : Promise.resolve({ data: { connections: [] }, replayed: false }),
    ]);
    function settle<T, R>(result: PromiseSettledResult<{ data: R }>, pick: (data: R) => T | undefined, set: (value: Section<T>) => void) {
      if (result.status === 'rejected') return set({ status: 'error', message: describeFailure(result.reason, 'read') });
      const value = pick(result.value.data);
      set(value === undefined ? { status: 'error', message: 'The FluxCore API returned an unsupported response.' } : { status: 'ready', value });
    }
    settle(p, (data) => (isProject(data, projectId, tenantId) ? data : undefined), setProject);
    settle(i, (data) => (Array.isArray(data.intakes) ? data.intakes.filter((row) => row.project_id === projectId) : undefined), setIntakes);
    settle(pl, (data) => (Array.isArray(data.engineering_plans) ? data.engineering_plans : undefined), setPlans);
    settle(tp, (data) => (Array.isArray(data.staffing_proposals) ? data.staffing_proposals : undefined), setProposals);
    settle(t, (data) => (Array.isArray(data.engineering_tasks) ? data.engineering_tasks : undefined), setTasks);
    settle(e, toAuditPage, setEvents);
    setAuditMore('idle');
    if (c.status === 'rejected' && c.reason instanceof FluxCoreApiError && c.reason.status === 503) {
      setConnections({ status: 'error', message: 'No repository connections are configured for this deployment.' });
    } else {
      settle(c, (data) => (Array.isArray(data.connections) ? data.connections : undefined), setConnections);
    }
  }, [canManage, pid, projectId, tenantId, tid]);

  useEffect(() => {
    // Initial backend read; state updates happen after the awaited responses.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function mutate(success: string, action: () => Promise<{ replayed: boolean }>, retry = false) {
    const binding = fenceBinding?.scope === scope ? fenceBinding : null;
    if (!binding || fenceBlocked || workingRef.current || (currentPending && !retry)) return false;
    if (retry) {
      if (!currentPending || !ownedFence.current || !ownsWriteFence(ownedFence.current)) {
        setFenceBlocked(true);
        return false;
      }
    } else {
      // Mark IN_FLIGHT before the HTTP write. A browser reload between commit
      // and response cannot silently create another key for the same command.
      const reservation = beginWriteFence(binding.key);
      if (!reservation) {
        setFenceBlocked(true);
        return false;
      }
      ownedFence.current = reservation;
      activeCommand.current = null; // Do not recover a prior command as this one.
    }
    workingRef.current = true;
    setWorking(true);
    setFailure('');
    setNotice('');
    try {
      const result = await action();
      if (retry && currentPending) {
        // A successful exact retry ends the original logical request. Rotate
        // its in-memory key only now, never on denial/outage.
        keys.current.settle(`${currentPending.method} ${currentPending.path} ${JSON.stringify(currentPending.body)}`, 200);
      }
      if (!ownedFence.current || !settleWriteFence(ownedFence.current, true)) setFenceBlocked(true);
      ownedFence.current = null;
      setPendingCommand(null);
      setNotice(result.replayed ? `${success} (already recorded; replayed without a second write)` : success);
      await load();
      return true;
    } catch (error) {
      // Once a request is uncertain, *any* unsuccessful retry (including a new
      // 401/403 after session expiry) cannot disprove the original commit.
      const unconfirmed = retry || isOutcomeUnconfirmed(error);
      setFailure(unconfirmed && retry
        ? 'The original change is still unconfirmed. Restore authorization and retry the same pending request; do not submit a new change.'
        : describeFailure(error));
      if (ownedFence.current && !settleWriteFence(ownedFence.current, !unconfirmed)) setFenceBlocked(true);
      if (unconfirmed && ownedFence.current) {
        const pending = retry ? currentPending : activeCommand.current ? { ...activeCommand.current, success, scope } : null;
        setPendingCommand(pending);
        if (!pending) {
          // We cannot recover an exact request even within this component.
          // Leave the persisted marker and disable mutations immediately.
          ownedFence.current = null;
          setFenceBlocked(true);
        }
      } else {
        setPendingCommand(null);
      }
      if (!unconfirmed) ownedFence.current = null;
      if (unconfirmed || (error instanceof FluxCoreApiError && (error.status === 409 || error.status === 404))) await load();
      return false;
    } finally {
      workingRef.current = false;
      setWorking(false);
    }
  }

  const write = <T,>(method: 'POST' | 'PUT', path: string, body: Record<string, unknown>) => {
    const snapshot = JSON.parse(JSON.stringify({ tenant_id: tenantId, ...body })) as Record<string, unknown>;
    const key = keys.current.keyFor(`${method} ${path} ${JSON.stringify(snapshot)}`);
    activeCommand.current = { method, path, body: snapshot, key };
    return callFluxCore<T>(method, path, { body: snapshot, keys: keys.current });
  };

  async function loadNewerEvents() {
    if (events.status !== 'ready' || events.value.next === null || auditMore === 'loading') return;
    const current = events.value;
    setAuditMore('loading');
    try {
      const { data } = await callFluxCore<DecisionEventsPayload>(
        'GET',
        `v1/projects/${pid}/decision-events?tenant_id=${tid}&limit=${auditPageSize}&after_project_version=${current.next}`,
      );
      const page = toAuditPage(data);
      if (!page) throw new Error('unsupported');
      setEvents({ status: 'ready', value: { ...page, rows: [...current.rows, ...page.rows] } });
      setAuditMore('idle');
    } catch {
      setAuditMore('failed');
    }
  }

  async function reload() {
    if (workingRef.current) return;
    workingRef.current = true;
    setWorking(true);
    try {
      await load();
    } finally {
      workingRef.current = false;
      setWorking(false);
    }
  }

  const retryControl = currentPending && !fenceBlocked && (
    <div className="mt-3 rounded-2xl border border-amber-200/30 p-4">
      <p className="text-sm text-amber-100">A change is awaiting confirmation. New changes are paused. Retry here reuses the original payload, project version and Idempotency-Key. Do not reload the browser before the outcome is confirmed.</p>
      <button className={`${secondary} mt-3`} disabled={working} type="button" onClick={() =>
        void mutate(currentPending.success, () => callFluxCore(currentPending.method, currentPending.path, {
          body: currentPending.body,
          keys: { keyFor: () => currentPending.key, settle: () => undefined },
        }), true)
      }>Retry pending change</button>
    </div>
  );
  const recoveryAlert = fenceBlocked && (
    <div role="alert" className="mt-3 rounded-2xl border border-amber-200/30 p-4 text-sm text-amber-100">
      A previous change may be unresolved in this browser for this project and account, or safe recovery storage is unavailable.
      New changes are blocked. A browser reload cannot safely restore the original request.
      An authorized operator must reconcile the backend audit and idempotency records before changes resume.
      Do not clear browser storage or submit the same change again.
    </div>
  );

  if (project.status !== 'ready') {
    return (
      <div role="status" className={card}>
        {project.status === 'loading' ? 'Loading project from FluxCore…' : project.message}
        {project.status === 'error' && <button className={`${secondary} mt-3 block`} disabled={working} type="button" onClick={() => void reload()}>Reload workspace</button>}
        {retryControl}
        {recoveryAlert}
      </div>
    );
  }
  const current = project.value;
  const version = current.version;

  return (
    <div className="space-y-6">
      <section aria-label="Project" className={card}>
        <button className={`${secondary} mb-3`} disabled={working} type="button" onClick={() => void reload()}>Reload workspace</button>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Shared project · version {version}</p>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-200">{current.outcome}</p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div><dt className="text-slate-400">Product area</dt><dd className="text-white">{current.application_domain}</dd></div>
          <div><dt className="text-slate-400">Application SME</dt><dd className="text-white">{current.workforce_plan?.expert?.name ?? 'Not proposed'} · {current.workforce_plan?.evidence_status ?? 'UNVERIFIED'}</dd></div>
          <div><dt className="text-slate-400">Repository</dt><dd className="break-all font-mono text-xs text-white">{current.repository_ref || 'No repository linked'}</dd></div>
        </dl>
        <p className="mt-4 text-xs text-slate-400">Execution is not authorized. Plans, staffing and tasks below are governed records only; nothing is dispatched to an agent.</p>
      </section>

      <div aria-live="polite">
        {notice && <p role="status" className="rounded-2xl border border-emerald-300/25 bg-emerald-300/5 p-3 text-sm text-emerald-50">{notice}</p>}
        {failure && <p role="alert" className="rounded-2xl border border-rose-300/30 bg-rose-300/5 p-3 text-sm text-rose-100">{failure}</p>}
        {retryControl}
        {recoveryAlert}
      </div>

      {canManage && (
        <RepositoryLink
          busy={busy}
          connections={connections}
          onResolve={(selection) => callFluxCore<{ commit_sha: string; rationale: string }>('POST', 'v1/source-control/resolve', { body: { tenant_id: tenantId, selection } })}
          onLink={(selection, commitSha) =>
            mutate('Repository linked to the resolved commit.', () =>
              write('PUT', `v1/projects/${pid}/repository`, { expected_version: version, source_selection: selection, commit_sha: commitSha }),
            )
          }
        />
      )}

      <section aria-labelledby="intake-heading" className={card}>
        <h2 id="intake-heading" className="text-lg font-semibold text-white">Intake and triage</h2>
        {canManage && (
          <IntakeForm
            busy={busy}
            onSubmit={(title, description) =>
              mutate('Intake saved and awaiting human triage.', () =>
                write('POST', 'v1/control-plane/intake', { project_id: projectId, title, description, source: 'fluxcore-engineer' }),
              )
            }
          />
        )}
        <SectionStatus section={intakes} empty={intakes.status === 'ready' && intakes.value.length === 0}>
          {(rows) => (
            <ul aria-label="Project intakes" className="mt-4 space-y-3">
              {rows.map((intake) => {
                const open = intake.triage_state === 'PENDING_TRIAGE' || intake.triage_state === 'QUARANTINED_REQUIRES_REVIEW';
                const planned = plans.status === 'ready' && plans.value.some((plan) => plan.intake_id === intake.intake_id);
                return (
                  <li key={intake.intake_id} className="rounded-2xl border border-white/10 p-4">
                    <p className="font-medium text-white">{intake.title ?? intake.intake_id}</p>
                    <p className="text-xs text-slate-400">{intake.triage_state} · intake version {intake.version ?? 1}</p>
                    {intake.warning && <p className="mt-1 text-xs text-amber-100">{intake.warning}</p>}
                    {open && canManage && (
                      <DecisionForm
                        label={`Triage ${intake.title ?? intake.intake_id}`}
                        options={['ACCEPTED', 'REJECTED']}
                        disabled={busy}
                        requireAcknowledgement={intake.triage_state === 'QUARANTINED_REQUIRES_REVIEW'}
                        onSubmit={(decision, reason, acknowledged) =>
                          mutate(`Intake ${decision.toLowerCase()}.`, () =>
                            write('POST', `v1/control-plane/intake/${encodeURIComponent(intake.intake_id)}/triage`, {
                              expected_version: intake.version ?? 1,
                              decision,
                              reason,
                              ...(intake.triage_state === 'QUARANTINED_REQUIRES_REVIEW' ? { acknowledge_heuristic_warning: acknowledged } : {}),
                            }),
                          )
                        }
                      />
                    )}
                    {intake.triage_state === 'ACCEPTED' && canManage && !planned && (
                      <button
                        className={`${secondary} mt-3`}
                        disabled={busy}
                        onClick={() =>
                          void mutate('Draft engineering plan saved.', () =>
                            write('POST', `v1/projects/${pid}/engineering-plans`, { expected_version: version, intake_id: intake.intake_id }),
                          )
                        }
                        type="button"
                      >
                        Draft engineering plan
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </SectionStatus>
      </section>

      <section aria-labelledby="plans-heading" className={card}>
        <h2 id="plans-heading" className="text-lg font-semibold text-white">Engineering plans</h2>
        <p className="mt-1 text-xs text-slate-400">A different person from the requester must approve a plan. Approval does not authorize execution.</p>
        <SectionStatus section={plans} empty={plans.status === 'ready' && plans.value.length === 0}>
          {(rows) => (
            <ul aria-label="Engineering plans" className="mt-4 space-y-3">
              {rows.map((plan) => (
                <li key={plan.plan_id} className="rounded-2xl border border-white/10 p-4">
                  <p className="font-medium text-white">Plan {plan.plan_id} · {plan.status}</p>
                  <p className="text-xs text-slate-400">Commit {plan.plan.commit_sha || 'none linked'} · saved at project version {plan.project_version}{plan.requested_by ? ` · requested by ${plan.requested_by}` : ''}{plan.decided_by ? ` · decided by ${plan.decided_by}` : ''}{plan.decided_at ? ` on ${plan.decided_at}` : ''}</p>
                  {plan.decision_reason && <p className="mt-1 text-sm text-slate-300">Decision reason: {plan.decision_reason}</p>}
                  <ol aria-label={`Stages of plan ${plan.plan_id}`} className="mt-2 list-inside list-decimal text-sm text-slate-200">
                    {plan.plan.stages.map((stage) => (
                      <li key={stage.stage_id}>
                        {stage.title} · {stage.risk_tier}{stage.capability ? ` · ${stage.capability}` : ''}{stage.requires_human_approval ? ' · human approval required' : ''}
                        {stage.depends_on && stage.depends_on.length > 0 ? ` · after ${stage.depends_on.map((id) => plan.plan.stages.find((s) => s.stage_id === id)?.title ?? id).join(', ')}` : ''}
                      </li>
                    ))}
                  </ol>
                  {plan.status === 'DRAFT' && canApprove && decisionBlocker(plan.requested_by, subject, 'plan') && (
                    <p className="mt-3 text-sm text-amber-100">{decisionBlocker(plan.requested_by, subject, 'plan')}</p>
                  )}
                  {plan.status === 'DRAFT' && canApprove && !decisionBlocker(plan.requested_by, subject, 'plan') && (
                    <DecisionForm
                      label={`Decide plan ${plan.plan_id}`}
                      options={['APPROVED', 'REJECTED']}
                      disabled={busy}
                      onSubmit={(decision, reason) =>
                        mutate(`Plan ${decision.toLowerCase()}.`, () =>
                          write('POST', `v1/projects/${pid}/engineering-plans/${encodeURIComponent(plan.plan_id)}/decision`, { expected_version: version, decision, reason }),
                        )
                      }
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </SectionStatus>
      </section>

      <section aria-labelledby="staffing-heading" className={card}>
        <h2 id="staffing-heading" className="text-lg font-semibold text-white">Staffing</h2>
        {canManage && plans.status === 'ready' && (
          <StaffingForm
            busy={busy}
            plans={plans.value.filter((plan) => plan.status !== 'REJECTED')}
            onSubmit={(budget, planId) =>
              mutate('Staffing proposal saved. No member is activated.', () =>
                write('POST', 'v1/workforce/org/staff', {
                  project_id: projectId,
                  expected_version: version,
                  budget_usd: budget,
                  ...(planId ? { engineering_plan_id: planId } : {}),
                }),
              )
            }
          />
        )}
        <SectionStatus section={proposals} empty={proposals.status === 'ready' && proposals.value.length === 0}>
          {(rows) => (
            <ul aria-label="Staffing proposals" className="mt-4 space-y-3">
              {rows.map((proposal) => (
                <li key={proposal.team_id} className="rounded-2xl border border-white/10 p-4">
                  <p className="font-medium text-white">Team {proposal.team_id} · {proposal.decision_status} · {proposal.activation_state}</p>
                  <p className="text-xs text-slate-400">Plan {proposal.engineering_plan_id ?? 'not linked'}{proposal.requested_by ? ` · requested by ${proposal.requested_by}` : ''}{proposal.decided_by ? ` · decided by ${proposal.decided_by}` : ''} · blocked: {proposal.execution_readiness.blocked_reasons.join(', ')}</p>
                  {proposal.decision_reason && <p className="mt-1 text-sm text-slate-300">Decision reason: {proposal.decision_reason}</p>}
                  <p className="mt-1 text-sm text-slate-200">{(proposal.team.members ?? []).map((member) => member.title ?? member.role_id ?? 'Role').join(' · ')}</p>
                  {proposal.decision_status === 'PROPOSED' && canApprove && decisionBlocker(proposal.requested_by, subject, 'team') && (
                    <p className="mt-3 text-sm text-amber-100">{decisionBlocker(proposal.requested_by, subject, 'team')}</p>
                  )}
                  {proposal.decision_status === 'PROPOSED' && canApprove && !decisionBlocker(proposal.requested_by, subject, 'team') && (
                    <DecisionForm
                      label={`Decide team ${proposal.team_id}`}
                      options={['APPROVED', 'REJECTED']}
                      disabled={busy}
                      onSubmit={(decision, reason) =>
                        mutate(`Staffing ${decision.toLowerCase()}.`, () =>
                          write('POST', `v1/projects/${pid}/team-proposals/${encodeURIComponent(proposal.team_id)}/decision`, { expected_version: version, decision, reason }),
                        )
                      }
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </SectionStatus>
      </section>

      <section aria-labelledby="tasks-heading" className={card}>
        <h2 id="tasks-heading" className="text-lg font-semibold text-white">Engineering tasks</h2>
        <p className="mt-1 text-xs text-slate-400">Tasks are backlog records only. READY_FOR_QUALIFICATION does not mean executable.</p>
        {canManage && plans.status === 'ready' && proposals.status === 'ready' && (
          <TaskForm
            busy={busy}
            pairs={plans.value
              .filter((plan) => plan.status === 'APPROVED')
              .flatMap((plan) =>
                proposals.value
                  .filter((proposal) => proposal.decision_status === 'APPROVED' && proposal.engineering_plan_id === plan.plan_id)
                  .map((proposal) => ({ planId: plan.plan_id, teamId: proposal.team_id })),
              )
              .filter((pair) => tasks.status !== 'ready' || !tasks.value.some((task) => task.plan_id === pair.planId))}
            onSubmit={(planId, teamId) =>
              mutate('Engineering tasks created without dispatch.', () =>
                write('POST', `v1/projects/${pid}/engineering-tasks`, { expected_version: version, engineering_plan_id: planId, team_id: teamId }),
              )
            }
          />
        )}
        <SectionStatus section={tasks} empty={tasks.status === 'ready' && tasks.value.length === 0}>
          {(rows) => (
            <ul aria-label="Engineering tasks" className="mt-4 space-y-3">
              {rows.map((task) => (
                <li key={task.task_id} className="rounded-2xl border border-white/10 p-4">
                  <p className="font-medium text-white">{task.title} · {task.state}</p>
                  <p className="text-xs text-slate-400">{task.risk_tier} · {task.assigned_role_title ?? 'unassigned'} · {task.blocked_reasons.join(', ') || 'no blocking reasons reported'}</p>
                  <dl className="mt-2 grid gap-x-4 gap-y-1 text-xs text-slate-300 sm:grid-cols-2">
                    {task.capability && <div><dt className="inline text-slate-400">Capability: </dt><dd className="inline">{task.capability}</dd></div>}
                    <div><dt className="inline text-slate-400">Depends on: </dt><dd className="inline">{task.depends_on && task.depends_on.length > 0 ? task.depends_on.map((id) => rows.find((other) => other.plan_id === task.plan_id && other.stage_id === id)?.title ?? id).join(', ') : 'nothing'}</dd></div>
                    <div><dt className="inline text-slate-400">Human approval: </dt><dd className="inline">{task.requires_human_approval ? 'required' : 'not required'}</dd></div>
                    <div><dt className="inline text-slate-400">Dispatch: </dt><dd className="inline">{task.dispatch_state ?? 'NOT_DISPATCHED'}</dd></div>
                    {task.execution_blocked_reasons && task.execution_blocked_reasons.length > 0 && (
                      <div className="sm:col-span-2"><dt className="inline text-slate-400">Execution blocked: </dt><dd className="inline">{task.execution_blocked_reasons.join(', ')}</dd></div>
                    )}
                    {task.status === 'CANCELLED' && (
                      <div className="sm:col-span-2"><dt className="inline text-slate-400">Cancelled: </dt><dd className="inline">{[task.cancelled_by && `by ${task.cancelled_by}`, task.cancelled_at, task.cancel_reason && `(${task.cancel_reason})`].filter(Boolean).join(' ') || 'yes'}</dd></div>
                    )}
                  </dl>
                  {task.status === 'OPEN' && canManage && (
                    <CancelTask
                      busy={busy}
                      title={task.title}
                      onSubmit={(reason) =>
                        mutate('Task cancelled.', () =>
                          write('POST', `v1/projects/${pid}/engineering-tasks/${encodeURIComponent(task.task_id)}/cancel`, { expected_version: version, reason }),
                        )
                      }
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </SectionStatus>
      </section>

      <section aria-labelledby="audit-heading" className={card}>
        <h2 id="audit-heading" className="text-lg font-semibold text-white">Decision audit</h2>
        <p className="mt-1 text-xs text-slate-400">
          {events.status === 'ready' && events.value.coverage === 'RECORDED_EVENTS_ONLY' ? 'Recorded events only.' : 'Recorded events.'}
          {events.status === 'ready' && events.value.legacyHistory === 'UNAVAILABLE' ? ' History from before audit recording is unavailable.' : ''}
          {events.status !== 'ready' || events.value.verification !== 'VERIFIED' ? ' Events are not independently verified.' : ''}
        </p>
        <SectionStatus section={events} empty={events.status === 'ready' && events.value.rows.length === 0}>
          {(page) => (
            <>
            <ol aria-label="Decision events" className="mt-4 space-y-2 text-sm text-slate-200">
              {page.rows.map((event) => (
                <li key={`${event.project_version}-${event.resource_id}-${event.event_kind}`}>
                  v{event.project_version} · {event.event_kind} · {event.resource_id}: {event.from_state} → {event.to_state} by {event.actor_subject}
                  {event.reason ? ` (${event.reason})` : ''} · <time dateTime={event.recorded_at}>{event.recorded_at}</time>
                </li>
              ))}
            </ol>
            {page.next !== null && (
              <button className={`${secondary} mt-3`} disabled={auditMore === 'loading'} type="button" onClick={() => void loadNewerEvents()}>
                {auditMore === 'loading' ? 'Loading newer events…' : 'Load newer events'}
              </button>
            )}
            {auditMore === 'failed' && <p role="status" className="mt-2 text-sm text-amber-100">Newer events could not be loaded. The events above are unchanged; try again.</p>}
            </>
          )}
        </SectionStatus>
      </section>
    </div>
  );
}

function RepositoryLink({
  busy,
  connections,
  onResolve,
  onLink,
}: {
  busy: boolean;
  connections: Section<Connection[]>;
  onResolve: (selection: Selection) => Promise<{ data: { commit_sha: string; rationale: string } }>;
  onLink: (selection: Selection, commitSha: string) => Promise<boolean>;
}) {
  const rows = connections.status === 'ready' ? connections.value : [];
  const [connectionId, setConnectionId] = useState('');
  const [kind, setKind] = useState<ScopeKind>('repository');
  const [reference, setReference] = useState('');
  const [path, setPath] = useState('');
  const [resolved, setResolved] = useState<{ signature: string; commit: string; rationale: string } | null>(null);
  const [problem, setProblem] = useState('');
  const [checking, setChecking] = useState(false);
  const selectedConnection = connectionId || rows[0]?.id || '';
  const selection = useMemo(() => buildSelection(selectedConnection, kind, reference, path), [selectedConnection, kind, reference, path]);
  const signature = JSON.stringify(selection);
  const current = resolved?.signature === signature ? resolved : null;

  async function check(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invalid = validateSelection(selection);
    setProblem(invalid ?? '');
    setResolved(null);
    if (invalid) return;
    setChecking(true);
    try {
      const { data } = await onResolve(selection);
      if (!hexCommit.test(data.commit_sha)) throw new Error('unsupported');
      setResolved({ signature, commit: data.commit_sha, rationale: data.rationale });
    } catch (error) {
      setProblem(describeFailure(error));
    } finally {
      setChecking(false);
    }
  }

  return (
    <section aria-labelledby="repository-heading" className={card}>
      <h2 id="repository-heading" className="text-lg font-semibold text-white">Repository link</h2>
      <p className="mt-1 text-xs text-slate-400">FluxCore resolves the selection on the server and stores only the immutable commit. Nothing is cloned or executed.</p>
      {connections.status !== 'ready' ? (
        <p role="status" className="mt-3 text-sm text-amber-100">{connections.status === 'loading' ? 'Loading connections…' : connections.message}</p>
      ) : rows.length === 0 ? (
        <p role="status" className="mt-3 text-sm text-slate-300">No repository connections are configured for this tenant.</p>
      ) : (
        <form aria-label="Repository selection" className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={check}>
          <label className="text-xs text-slate-300">Connection
            <select className={field} value={selectedConnection} onChange={(event) => setConnectionId(event.target.value)}>
              {rows.map((row) => <option key={row.id} value={row.id}>{row.repository} · default {row.default_branch}</option>)}
            </select>
          </label>
          <label className="text-xs text-slate-300">Scope
            <select className={field} value={kind} onChange={(event) => setKind(event.target.value as ScopeKind)}>
              <option value="repository">Default branch</option>
              <option value="branch">Branch or tag</option>
              <option value="commit">Full commit SHA</option>
              <option value="path">Path within a ref</option>
            </select>
          </label>
          {kind !== 'repository' && (
            <label className="text-xs text-slate-300">{kind === 'commit' ? 'Commit SHA' : 'Branch or tag'}
              <input className={field} value={reference} onChange={(event) => setReference(event.target.value)} />
            </label>
          )}
          {kind === 'path' && (
            <label className="text-xs text-slate-300">Repository-relative path
              <input className={field} value={path} onChange={(event) => setPath(event.target.value)} placeholder="services/api" />
            </label>
          )}
          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button className={secondary} disabled={busy || checking} type="submit">{checking ? 'Checking…' : 'Check commit'}</button>
            <button className={primary} disabled={busy || !current} onClick={() => current && void onLink(selection, current.commit)} type="button">Link repository</button>
          </div>
        </form>
      )}
      {problem && <p role="alert" className="mt-3 text-sm text-rose-100">{problem}</p>}
      {current && <p role="status" className="mt-3 break-all text-sm text-emerald-100">Resolves to {current.commit}. {current.rationale}</p>}
    </section>
  );
}

function IntakeForm({ busy, onSubmit }: { busy: boolean; onSubmit: (title: string, description: string) => Promise<boolean> }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await onSubmit(title.trim(), description.trim())) {
      setTitle('');
      setDescription('');
    }
  }
  return (
    <form aria-label="Submit intake" className="mt-4 grid gap-3" onSubmit={submit}>
      <label className="text-xs text-slate-300">Intake title
        <input className={field} maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} required />
      </label>
      <label className="text-xs text-slate-300">Requirements
        <textarea className={`${field} min-h-24 py-2`} maxLength={16384} value={description} onChange={(event) => setDescription(event.target.value)} required />
      </label>
      <button className={`${primary} justify-self-start`} disabled={busy || !title.trim() || !description.trim()} type="submit">Submit for triage</button>
    </form>
  );
}

function StaffingForm({ busy, plans, onSubmit }: { busy: boolean; plans: Plan[]; onSubmit: (budget: number, planId: string) => Promise<boolean> }) {
  const [budget, setBudget] = useState('');
  const [planId, setPlanId] = useState('');
  const amount = Number(budget);
  return (
    <form
      aria-label="Propose staffing"
      className="mt-4 grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)_auto]"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(amount, planId);
      }}
    >
      <label className="text-xs text-slate-300">Budget ceiling (USD)
        <input className={field} inputMode="decimal" min="0.01" step="0.01" type="number" value={budget} onChange={(event) => setBudget(event.target.value)} required />
      </label>
      <label className="text-xs text-slate-300">Linked plan
        <select className={field} value={planId} onChange={(event) => setPlanId(event.target.value)}>
          <option value="">No plan linked</option>
          {plans.map((plan) => <option key={plan.plan_id} value={plan.plan_id}>{plan.plan_id} · {plan.status}</option>)}
        </select>
      </label>
      <button className={`${primary} self-end`} disabled={busy || !Number.isFinite(amount) || amount <= 0} type="submit">Propose team</button>
    </form>
  );
}

function TaskForm({ busy, pairs, onSubmit }: { busy: boolean; pairs: Array<{ planId: string; teamId: string }>; onSubmit: (planId: string, teamId: string) => Promise<boolean> }) {
  const [choice, setChoice] = useState('');
  if (pairs.length === 0) return <p className="mt-3 text-sm text-slate-400">Tasks can be created once a plan and a staffing proposal linked to it are both approved.</p>;
  const selected = pairs.find((pair) => `${pair.planId}|${pair.teamId}` === choice) ?? pairs[0];
  return (
    <form
      aria-label="Create engineering tasks"
      className="mt-4 flex flex-wrap items-end gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (selected) void onSubmit(selected.planId, selected.teamId);
      }}
    >
      <label className="text-xs text-slate-300">Approved plan and team
        <select className={field} value={selected ? `${selected.planId}|${selected.teamId}` : ''} onChange={(event) => setChoice(event.target.value)}>
          {pairs.map((pair) => <option key={`${pair.planId}|${pair.teamId}`} value={`${pair.planId}|${pair.teamId}`}>Plan {pair.planId} · team {pair.teamId}</option>)}
        </select>
      </label>
      <button className={primary} disabled={busy} type="submit">Create tasks</button>
    </form>
  );
}

function CancelTask({ busy, title, onSubmit }: { busy: boolean; title: string; onSubmit: (reason: string) => Promise<boolean> }) {
  const [reason, setReason] = useState('');
  return (
    <form
      aria-label={`Cancel ${title}`}
      className="mt-3 flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(reason.trim());
      }}
    >
      <label className="text-xs text-slate-300">Cancellation reason
        <input className={field} maxLength={2000} value={reason} onChange={(event) => setReason(event.target.value)} required />
      </label>
      <button className={secondary} disabled={busy || !reason.trim()} type="submit">Cancel task</button>
    </form>
  );
}
