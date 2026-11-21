'use client';

import React, { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import {
  beginWriteFence, isWriteFenceBlocked, ownsWriteFence,
  prepareWriteFence, readWriteFenceOutcome, scopedCreateFenceKey, settleWriteFence, type WriteFence,
} from '@/lib/release0-write-fence';

// Consumer-side validation: the backend remains the contract owner.
const projectSchema = z
  .object({
    id: z.string().min(1),
    tenant_id: z.string().min(1),
    name: z.string().min(1),
    status: z.literal('PROPOSED'),
    workforce_plan: z.object({
      domain: z.string(),
      evidence_status: z.literal('UNVERIFIED'),
      status: z.literal('PROPOSED'),
      roles: z.array(
        z.object({
          role_id: z.string(),
          title: z.string(),
          capability: z.string(),
          discipline: z.string(),
          max_risk_tier: z.string(),
        }),
      ),
      expert: z.object({
        expert_id: z.string(),
        name: z.string(),
        domain: z.string(),
        is_verified: z.literal(false),
      }),
      execution_authorized: z.literal(false),
      required_gates: z.array(z.string()),
    }),
    estimated_cost_usd: z.number().nonnegative().nullable().optional(),
  })
  .passthrough();
type Project = z.infer<typeof projectSchema>;
type PendingCreate = { key: string; payload: string; fence: WriteFence };

const fieldClass =
  'w-full rounded-2xl border border-white/20 bg-slate-950/70 p-4 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300';

export function CreateIntake({
  subject,
  tenantId,
  workspaceId,
  initialIdea = '',
}: {
  /** Verified by the server session; never supplied by a browser form. */
  subject: string;
  tenantId: string;
  workspaceId: string;
  initialIdea?: string;
}) {
  const [idea, setIdea] = useState(initialIdea.slice(0, 12000));
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [project, setProject] = useState<Project | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [responseScope, setResponseScope] = useState('');
  const [projectScope, setProjectScope] = useState('');
  const scope = JSON.stringify([subject, tenantId, workspaceId]);
  const [fenceBinding, setFenceBinding] = useState<{ scope: string; key: string } | null>(null);
  const [fenceBlocked, setFenceBlocked] = useState(false);
  // Fence key of the in-memory command retained for exact retry. Render
  // reads this state, never the ref, so retry affordances stay consistent.
  const [retryKey, setRetryKey] = useState<string | null>(null);
  const pendingRef = useRef(false);
  const activeCreate = useRef<PendingCreate | null>(null);
  const recoveryGeneration = useRef(0);
  const ready = fenceBinding?.scope === scope;
  const recoveryRequired = fenceBlocked || !ready;
  const retryAvailable = retryKey !== null && retryKey === fenceBinding?.key &&
    !fenceBlocked && ready;
  const editingBlocked = pending || retryAvailable || recoveryRequired;

  useEffect(() => {
    let live = true;
    let observedKey: string | null = null;
    activeCreate.current = null;
    const onStorage = (event: StorageEvent) => {
      if (observedKey && (event.key === observedKey || event.key === null)) {
        // A marker stolen/removed during an in-flight attempt cannot be
        // treated as a successful confirmation by another tab.
        const owner = activeCreate.current?.fence;
        const lostOwner = !!owner && !ownsWriteFence(owner);
        setFenceBlocked(lostOwner || (isWriteFenceBlocked(observedKey) &&
          !(owner && ownsWriteFence(owner))));
      }
    };
    void scopedCreateFenceKey(subject, tenantId, workspaceId).then((key) => {
      if (!live) return;
      observedKey = key;
      setFenceBlocked(isWriteFenceBlocked(key));
      setRetryKey(null);
      setFenceBinding({ scope, key });
      window.addEventListener('storage', onStorage);
    }).catch(() => {
      if (live) setFenceBlocked(true);
    });
    return () => {
      live = false;
      recoveryGeneration.current += 1;
      window.removeEventListener('storage', onStorage);
    };
  }, [scope, subject, tenantId, workspaceId]);

  function invalidate() {
    if (pendingRef.current || retryAvailable || recoveryRequired) return;
    setProject(null);
    setError('');
  }
  const starterIdeas = [
    {
      label: 'A simple online shop',
      idea: 'A welcoming online shop where customers can browse products, save favorites, and place an order.',
      name: 'Online shop',
      domain: 'E-commerce',
    },
    {
      label: 'A team planner',
      idea: 'A shared planner where a small team can organize tasks, see what is next, and track progress.',
      name: 'Team planner',
      domain: 'Productivity software',
    },
    {
      label: 'Something for my industry',
      idea: 'An application that helps people in my industry complete their most important daily work.',
      name: 'My industry application',
      domain: 'Industry-specific software',
    },
  ];
  async function executeCreate(retry: boolean) {
    const generation = recoveryGeneration.current;
    const binding = fenceBinding?.scope === scope ? fenceBinding : null;
    if (pendingRef.current || !binding || fenceBlocked ||
      (retry && !retryAvailable) || (!retry && (retryAvailable ||
        (project !== null && projectScope === scope)))) return;

    let command: PendingCreate;
    if (retry) {
      const existing = activeCreate.current;
      if (!existing || !ownsWriteFence(existing.fence) || existing.fence.key !== binding.key) {
        setFenceBlocked(true);
        return;
      }
      command = existing;
    } else {
      const fence = beginWriteFence(binding.key);
      if (!fence) {
        setFenceBlocked(true);
        return;
      }
      const key = fence.nonce;
      if (!prepareWriteFence(fence, { command: 'PROJECT_CREATE' })) {
        // Refuse transmission unless the locator is durably readable.
        settleWriteFence(fence, false);
        setFenceBlocked(true);
        return;
      }
      const body = JSON.stringify({
        tenant_id: tenantId,
        name: name.trim() || idea.trim().split(/\s+/).slice(0, 5).join(' ').replace(/[.,!?;:]$/, ''),
        outcome: idea.trim(),
        application_domain: domain.trim() || 'General software — SME classification pending',
      });
      command = { fence, key, payload: body };
      activeCreate.current = command;
    }
    pendingRef.current = true;
    setPending(true);
    setError('');
    setResponseScope(scope);
    setProject(null);
    let definitiveStatus: number | null = null;
    try {
      const response = await fetch('/api/proxy/sdx/v1/projects', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'Idempotency-Key': command.key },
        body: command.payload,
      });
      if (!response.ok) {
        definitiveStatus = response.status;
        throw new Error(`Project service returned ${response.status}. No execution was started.`);
      }
      // An unreadable 2xx may have committed; never rotate its replay key.
      const parsed = projectSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error('The service returned an unsupported project.');
      if (parsed.data.tenant_id !== tenantId) throw new Error('The service returned a project for a different tenant.');
      if (generation !== recoveryGeneration.current) return;

      const safelySettled = settleWriteFence(command.fence, true);
      activeCreate.current = null;
      setRetryKey(null);
      if (!safelySettled) {
        setFenceBlocked(true);
        setError('Project creation was returned, but safe browser reconciliation failed. New creations remain blocked.');
      }
      setProject(parsed.data);
      setProjectScope(scope);
    } catch (failure) {
      if (generation !== recoveryGeneration.current) return;
      // After a prior ambiguous attempt, even a new 401/403 does not prove
      // the original write was absent. Keep the original payload/key in RAM.
      const uncertain = retry || definitiveStatus === null ||
        definitiveStatus === 408 || definitiveStatus >= 500;
      const safelySettled = settleWriteFence(command.fence, !uncertain);
      if (!safelySettled) setFenceBlocked(true);
      if (uncertain && safelySettled) {
        setRetryKey(command.fence.key);
      } else {
        setRetryKey(null);
        activeCreate.current = null;
      }
      const detail = failure instanceof Error ? failure.message : 'Project service unavailable.';
      setError(uncertain
        ? `Project creation is unconfirmed. It may already have been saved. Retry only the original pending request, or ask an operator to reconcile it. ${detail}`
        : detail);
      setResponseScope(scope);
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await executeCreate(false);
  }

  async function recover() {
    if (pendingRef.current || !ready || !fenceBinding) return;
    const generation = recoveryGeneration.current;
    pendingRef.current = true;
    setPending(true);
    setResponseScope(scope);
    try {
      const result = await readWriteFenceOutcome(fenceBinding.key, tenantId);
      if (result.outcome !== 'COMMITTED') throw new Error('The server cannot establish this creation outcome. It may still commit. New creations remain blocked; do not resubmit with a new key.');
      const response = await fetch(`/api/proxy/sdx/v1/projects/${encodeURIComponent(result.resourceId)}?tenant_id=${encodeURIComponent(tenantId)}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Creation was recorded, but the project is unavailable. Recovery remains required.');
      const parsed = projectSchema.safeParse(await response.json());
      if (!parsed.success || parsed.data.id !== result.resourceId || parsed.data.tenant_id !== tenantId) {
        throw new Error('Recovered project scope or format is unsupported.');
      }
      if (generation !== recoveryGeneration.current) return;
      if (!settleWriteFence(result.fence, true)) throw new Error('Safe browser reconciliation failed. New creations remain blocked.');
      activeCreate.current = null;
      setRetryKey(null);
      setFenceBlocked(false);
      setError('');
      setProject(parsed.data);
      setProjectScope(scope);
    } catch (failure) {
      if (generation === recoveryGeneration.current) setError(failure instanceof Error ? failure.message : 'Recovery unavailable. New creations remain blocked.');
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }
  return (
    <section
      className="relative isolate space-y-7 overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70 p-5 shadow-2xl shadow-black/20 sm:p-8"
      aria-label="FluxCore Create"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-28 -z-10 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl"
      />
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">
          FluxCore Create · Start with an idea
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          What would you like to make?
        </h2>
        <p className="mt-3 text-base leading-7 text-slate-300">
          Tell us in your own words. FluxCore will shape a project, propose an
          application SME and supporting roles, then let you review the plan
          before engineering work begins.
        </p>
      </div>
      <div role="group" className="grid gap-3 sm:grid-cols-3" aria-label="Idea starters">
        {starterIdeas.map((starter) => (
          <button
            key={starter.label}
            type="button"
            disabled={editingBlocked}
            onClick={() => {
              invalidate();
              setIdea(starter.idea);
              setName(starter.name);
              setDomain(starter.domain);
            }}
            className="min-h-14 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-left text-sm font-medium text-slate-200 transition hover:border-cyan-200/40 hover:bg-cyan-200/[0.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
          >
            {starter.label}
            <span aria-hidden="true" className="ml-2 text-cyan-200">
              ↗
            </span>
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-400">
        Workspace: {workspaceId} · Project and engineering state are shared with
        FluxCore Engineer.
      </p>
      <form onSubmit={submit} className="space-y-4" aria-busy={pending}>
        <label className="block space-y-2">
          <span className="font-medium text-white">
            Describe what you have in mind
          </span>
          <textarea
            disabled={editingBlocked}
            required
            minLength={5}
            maxLength={12000}
            rows={5}
            placeholder="For example: Help local farmers sell fresh produce directly to nearby restaurants…"
            className={
              fieldClass +
              ' min-h-36 resize-y text-base leading-7 placeholder:text-slate-500'
            }
            value={idea}
            onChange={(event) => {
              invalidate();
              setIdea(event.target.value);
            }}
            aria-describedby="idea-help"
          />
        </label>
        <p id="idea-help" className="text-sm text-slate-400">
          A rough idea is enough. You can refine the details with your team
          later.
        </p>
        <details className="group rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-200 marker:text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
            Add project details{' '}
            <span className="font-normal text-slate-400">
              (optional — helps match the right SME)
            </span>
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm">Project name</span>
              <input
                disabled={editingBlocked}
                maxLength={160}
                placeholder="We can suggest one from your idea"
                className={fieldClass}
                value={name}
                onChange={(event) => {
                  invalidate();
                  setName(event.target.value);
                }}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm">Industry or area</span>
              <input
                disabled={editingBlocked}
                maxLength={160}
                placeholder="e.g. education, health, retail"
                className={fieldClass}
                value={domain}
                onChange={(event) => {
                  invalidate();
                  setDomain(event.target.value);
                }}
                aria-describedby="domain-help"
              />
            </label>
            <p
              id="domain-help"
              className="text-sm leading-6 text-slate-400 sm:col-span-2"
            >
              FluxCore uses this to propose an application-specific SME and
              specialist roles. If you skip it, the project starts with a
              general software SME proposal that can be refined later. Expertise
              is unverified until assessed.
            </p>
          </div>
        </details>
        <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={editingBlocked || (project !== null && projectScope === scope) || idea.trim().length < 5}
            className="min-h-12 rounded-2xl bg-[var(--bac-color-primary)] px-6 py-3 font-semibold text-white shadow-lg shadow-cyan-950/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
          >
            {pending ? 'Preparing your project…' : 'Create my project'}
          </button>
          <p className="text-xs leading-5 text-slate-400">
            This creates a shared project and proposed team. It does not run
            agents, create a repository, or deploy.
          </p>
        </div>
      </form>
      {error && responseScope === scope && (
        <p role="alert" className="text-rose-200">
          {error}
        </p>
      )}
      {retryAvailable && !pending && (
        <div className="rounded-2xl border border-amber-200/30 p-4 text-sm text-amber-100">
          <p>A previous project creation is unconfirmed. New creations are paused. This retry uses exactly the original body and Idempotency-Key.</p>
          <button className="mt-3 min-h-11 rounded-xl border border-amber-200/40 px-4 font-semibold" type="button"
            onClick={() => void executeCreate(true)}>Retry pending project creation</button>
        </div>
      )}
      {fenceBlocked && (
        <p role="alert" className="rounded-2xl border border-amber-200/30 p-4 text-sm text-amber-100">
          A previous project creation may be unresolved in this workspace and account, or its safe recovery marker was lost.
          New creations are blocked until an authorized operator reconciles the backend project and idempotency records.
          A browser reload cannot restore the original request. Do not clear browser storage and resubmit.
        </p>
      )}
      {(fenceBlocked || retryAvailable) && ready && (
        <button type="button" disabled={pending} onClick={() => void recover()}
          className="min-h-11 rounded-xl border border-amber-200/40 px-4 font-semibold">
          Check project creation outcome
        </button>
      )}
      <div aria-live="polite">
        {project && projectScope === scope && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">
              Your project is ready to review: {project.name}
            </h3>
            <p>Shared project ID: {project.id}</p>
            <p>{project.workforce_plan.domain} · Proposed · Unverified</p>
            <h4 className="font-semibold">
              {project.workforce_plan.expert.name}
            </h4>
            <p>
              Expertise is unverified. No agent has been staffed or activated.
            </p>
            <ul className="space-y-3">
              {project.workforce_plan.roles.map((role) => (
                <li key={role.role_id}>
                  <strong>{role.title}</strong>
                  <p>
                    {role.capability} · {role.discipline} · Maximum risk tier:{' '}
                    {role.max_risk_tier}
                  </p>
                </li>
              ))}
            </ul>
            <h4 className="font-semibold">Required gates</h4>
            <ul className="list-inside list-disc">
              {project.workforce_plan.required_gates.map((gate) => (
                <li key={gate}>{gate}</li>
              ))}
            </ul>
            <p>
              {project.estimated_cost_usd == null
                ? 'Cost: unknown until measured'
                : `Estimated cost: USD ${project.estimated_cost_usd}`}
            </p>
            <details>
              <summary className="cursor-pointer">
                Inspect project and proposal
              </summary>
              <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words text-sm">
                {JSON.stringify(project, null, 2)}
              </pre>
            </details>
            <Link
              className="inline-block rounded-2xl bg-[var(--bac-color-primary)] px-5 py-3 font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
              href={`/software-factory/workspaces/${encodeURIComponent(project.id)}`}
            >
              Continue in FluxCore Engineer
            </Link>
            <p className="text-sm text-slate-300">Execution remains blocked.</p>
            <p>
              No generated files, test results, preview, deployment, or
              production authorization is claimed.
            </p>
          </div>
        )}
      </div>
      <Link
        className="inline-block rounded-2xl border border-cyan-200/30 px-5 py-3 font-medium text-cyan-100 transition hover:bg-cyan-200/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
        href="/software-factory/workspaces"
      >
        Open FluxCore Engineer →
      </Link>
      <p className="text-sm text-slate-400">
        Project ID: shared across Create and Engineer · Workspace: {workspaceId}
      </p>
    </section>
  );
}
