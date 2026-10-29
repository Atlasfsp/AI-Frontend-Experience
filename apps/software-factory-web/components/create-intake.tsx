'use client';

import React, { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { z } from 'zod';

// Consumer-side validation: the backend remains the contract owner.
const projectSchema = z.object({
  id: z.string().min(1), tenant_id: z.string().min(1), name: z.string().min(1), status: z.literal('PROPOSED'),
  workforce_plan: z.object({
    domain: z.string(), evidence_status: z.literal('UNVERIFIED'), status: z.literal('PROPOSED'),
    roles: z.array(z.object({ role_id: z.string(), title: z.string(), capability: z.string(), discipline: z.string(), max_risk_tier: z.string() })),
    expert: z.object({ expert_id: z.string(), name: z.string(), domain: z.string(), is_verified: z.literal(false) }),
    execution_authorized: z.literal(false), required_gates: z.array(z.string()),
  }),
  estimated_cost_usd: z.number().nonnegative().nullable().optional(),
}).passthrough();
type Project = z.infer<typeof projectSchema>;
const fieldClass = 'w-full rounded-2xl border border-white/20 bg-slate-950/70 p-4 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300';

export function CreateIntake({ tenantId, workspaceId }: { tenantId: string; workspaceId: string }) {
  const [idea, setIdea] = useState('');
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [project, setProject] = useState<Project | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const revision = useRef(0);
  const idempotencyKey = useRef('');
  function invalidate() { revision.current += 1; idempotencyKey.current = ''; setProject(null); setError(''); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submittedRevision = ++revision.current;
    setPending(true); setProject(null); setError('');
    if (!idempotencyKey.current) idempotencyKey.current = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      const response = await fetch('/api/proxy/sdx/v1/projects', {
        method: 'POST', headers: { 'content-type': 'application/json', 'Idempotency-Key': idempotencyKey.current },
        body: JSON.stringify({ tenant_id: tenantId, name: name.trim(), outcome: idea.trim(), application_domain: domain.trim() }),
      });
      if (!response.ok) throw new Error(`Project service returned ${response.status}. No execution was started.`);
      const parsed = projectSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error('The service returned an unsupported project. No execution was started.');
      if (parsed.data.tenant_id !== tenantId) throw new Error('The service returned a project for a different tenant.');
      if (revision.current === submittedRevision) setProject(parsed.data);
    } catch (failure) {
      if (revision.current === submittedRevision) setError(failure instanceof Error ? failure.message : 'Proposal service unavailable.');
    } finally { setPending(false); }
  }
  return <section className="space-y-6 rounded-[28px] border border-white/10 bg-white/[0.04] p-6" aria-label="FluxCore Create">
    <div><h2 className="text-2xl font-semibold">FluxCore Create</h2><p className="mt-2 text-slate-300">Describe your application. Review its proposed domain expert and engineering team before any execution.</p></div>
    <p className="text-sm text-slate-300">Shared session context: <span>{tenantId} / {workspaceId}</span>. Creating a project does not start execution or create a Git repository.</p>
    <form onSubmit={submit} className="space-y-4" aria-busy={pending}>
      <label className="block space-y-2"><span>What would you like to build?</span><textarea required minLength={5} maxLength={12000} rows={4} className={fieldClass} value={idea} onChange={(event) => { invalidate(); setIdea(event.target.value); }} /></label>
      <label className="block space-y-2"><span>Project name</span><input required maxLength={160} className={fieldClass} value={name} onChange={(event) => { invalidate(); setName(event.target.value); }} /></label>
      <label className="block space-y-2"><span>Application domain or industry</span><input required maxLength={160} className={fieldClass} value={domain} onChange={(event) => { invalidate(); setDomain(event.target.value); }} aria-describedby="domain-help" /></label>
      <p id="domain-help" className="text-sm text-slate-300">Confirm the field your app will serve, including specialist or emerging industries. FluxCore proposes an SME and supporting roles; expertise remains unverified until assessed.</p>
      <button type="submit" disabled={pending || idea.trim().length < 5 || !name.trim() || !domain.trim()} className="rounded-2xl bg-[var(--bac-color-primary)] px-5 py-3 font-semibold text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">{pending ? 'Creating project…' : 'Create project and propose its team'}</button>
    </form>
    {error && <p role="alert" className="text-rose-200">{error}</p>}
    <div aria-live="polite">{project && <div className="space-y-4">
      <h3 className="text-xl font-semibold">Project created: {project.name}</h3>
      <p>Shared project ID: {project.id}</p>
      <p>{project.workforce_plan.domain} · Proposed · Unverified</p>
      <h4 className="font-semibold">{project.workforce_plan.expert.name}</h4>
      <p>Expertise is unverified. No agent has been staffed or activated.</p>
      <ul className="space-y-3">{project.workforce_plan.roles.map((role) => <li key={role.role_id}><strong>{role.title}</strong><p>{role.capability} · {role.discipline} · Maximum risk tier: {role.max_risk_tier}</p></li>)}</ul>
      <h4 className="font-semibold">Required gates</h4><ul className="list-inside list-disc">{project.workforce_plan.required_gates.map((gate) => <li key={gate}>{gate}</li>)}</ul>
      <p>{project.estimated_cost_usd == null ? 'Cost: unknown until measured' : `Estimated cost: USD ${project.estimated_cost_usd}`}</p>
      <details><summary className="cursor-pointer">Inspect project and proposal</summary><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words text-sm">{JSON.stringify(project, null, 2)}</pre></details>
      <button type="button" disabled className="rounded-2xl border border-white/20 px-5 py-3 opacity-60">Execution blocked</button>
      <p>No generated files, test results, preview, deployment, or production authorization is claimed.</p>
    </div>}</div>
    <Link className="inline-block rounded-2xl border border-white/20 px-5 py-3 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300" href="/software-factory/workspaces">Open FluxCore Engineer workspace selector</Link>
    <p className="text-sm text-slate-300">This is the canonical project ID for Create and Engineer. Engineer UI binding and the Hasura tenant-filtered read path remain in progress. No repository has been linked until you connect one in Engineer.</p>
  </section>;
}
