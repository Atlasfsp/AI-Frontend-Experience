'use client';

import React, { useRef, useState, type FormEvent } from 'react';
import { z } from 'zod';

// Consumer-side validation: the backend remains the contract owner.
const proposalSchema = z.object({
  workforce_plan: z.object({
    domain: z.string(), evidence_status: z.literal('UNVERIFIED'), status: z.literal('PROPOSED'),
    roles: z.array(z.object({ role_id: z.string(), title: z.string(), capability: z.string(), discipline: z.string(), max_risk_tier: z.string() })),
    expert: z.object({ expert_id: z.string(), name: z.string(), domain: z.string(), is_verified: z.literal(false) }),
    execution_authorized: z.literal(false), required_gates: z.array(z.string()),
  }),
  estimated_cost_usd: z.number().nonnegative().nullable().optional(),
}).passthrough();
type Proposal = z.infer<typeof proposalSchema>;
const fieldClass = 'w-full rounded-2xl border border-white/20 bg-slate-950/70 p-4 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300';

export function CreateIntake({ tenantId, workspaceId }: { tenantId: string; workspaceId: string }) {
  const [idea, setIdea] = useState('');
  const [domain, setDomain] = useState('');
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const revision = useRef(0);
  function invalidate() { revision.current += 1; setProposal(null); setError(''); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submittedRevision = ++revision.current;
    setPending(true); setProposal(null); setError('');
    try {
      const response = await fetch('/api/proxy/sdx/v1/activation/compiler/compile', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ idea_prompt: idea.trim(), ...(domain.trim() ? { application_domain: domain.trim() } : {}) }),
      });
      if (!response.ok) throw new Error(`Proposal service returned ${response.status}. No execution was started.`);
      const parsed = proposalSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error('The service returned an unsupported proposal. No execution was started.');
      if (revision.current === submittedRevision) setProposal(parsed.data);
    } catch (failure) {
      if (revision.current === submittedRevision) setError(failure instanceof Error ? failure.message : 'Proposal service unavailable.');
    } finally { setPending(false); }
  }
  return <section className="space-y-6 rounded-[28px] border border-white/10 bg-white/[0.04] p-6" aria-label="FluxCore Create">
    <div><h2 className="text-2xl font-semibold">FluxCore Create</h2><p className="mt-2 text-slate-300">Describe your application. Review its proposed domain expert and engineering team before any execution.</p></div>
    <p className="text-sm text-slate-300">Shared session context: <span>{tenantId} / {workspaceId}</span>. No project or Git repository has been created by this intake.</p>
    <form onSubmit={submit} className="space-y-4" aria-busy={pending}>
      <label className="block space-y-2"><span>What would you like to build?</span><textarea required minLength={5} maxLength={12000} rows={4} className={fieldClass} value={idea} onChange={(event) => { invalidate(); setIdea(event.target.value); }} /></label>
      <label className="block space-y-2"><span>Application domain or industry</span><input maxLength={160} className={fieldClass} value={domain} onChange={(event) => { invalidate(); setDomain(event.target.value); }} aria-describedby="domain-help" /></label>
      <p id="domain-help" className="text-sm text-slate-300">Use any industry, including a specialist or emerging field. Leave blank for domain inference. Proposed expertise requires verification.</p>
      <button type="submit" disabled={pending || idea.trim().length < 5} className="rounded-2xl bg-[var(--bac-color-primary)] px-5 py-3 font-semibold text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">{pending ? 'Preparing proposal…' : 'Prepare engineering proposal'}</button>
    </form>
    {error && <p role="alert" className="text-rose-200">{error}</p>}
    <div aria-live="polite">{proposal && <div className="space-y-4">
      <h3 className="text-xl font-semibold">Workforce proposal</h3>
      <p>{proposal.workforce_plan.domain} · Proposed · Unverified</p>
      <h4 className="font-semibold">{proposal.workforce_plan.expert.name}</h4>
      <p>Expertise is unverified. No agent has been staffed or activated.</p>
      <ul className="space-y-3">{proposal.workforce_plan.roles.map((role) => <li key={role.role_id}><strong>{role.title}</strong><p>{role.capability} · {role.discipline} · Maximum risk tier: {role.max_risk_tier}</p></li>)}</ul>
      <h4 className="font-semibold">Required gates</h4><ul className="list-inside list-disc">{proposal.workforce_plan.required_gates.map((gate) => <li key={gate}>{gate}</li>)}</ul>
      <p>{proposal.estimated_cost_usd == null ? 'Cost: unknown' : `Estimated cost: USD ${proposal.estimated_cost_usd}`}</p>
      <details><summary className="cursor-pointer">Inspect returned proposal</summary><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words text-sm">{JSON.stringify(proposal, null, 2)}</pre></details>
      <button type="button" disabled className="rounded-2xl border border-white/20 px-5 py-3 opacity-60">Execution blocked</button>
      <p>No generated files, test results, preview, deployment, or production authorization is claimed.</p>
    </div>}</div>
    <a className="inline-block rounded-2xl border border-white/20 px-5 py-3 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300" href="/software-factory/workspaces">Open FluxCore Engineer workspace selector</a>
    <p className="text-sm text-slate-300">Engineer uses the same authenticated tenant and workspace. Proposal persistence and project binding are not yet available.</p>
  </section>;
}
