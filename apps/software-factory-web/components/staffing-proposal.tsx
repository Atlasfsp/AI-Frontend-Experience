'use client';

import React, { useRef, useState, type FormEvent } from 'react';
import type { PersistedStaffingProposal } from '@/features/projects';

type Proposal = { members?: Array<{ role_id?: string; title?: string }> };

export function StaffingProposal({
  projectId,
  tenantId,
  version,
  existingProposals = [],
}: {
  projectId: string;
  tenantId: string;
  version: number;
  existingProposals?: PersistedStaffingProposal[];
}) {
  const [budget, setBudget] = useState('');
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const idempotencyKey = useRef('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError('');
    setProposal(null);
    if (!idempotencyKey.current) {
      idempotencyKey.current =
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
    try {
      const response = await fetch('/api/proxy/sdx/v1/workforce/org/staff', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'Idempotency-Key': idempotencyKey.current,
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          project_id: projectId,
          expected_version: version,
          budget_usd: Number(budget),
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        team_proposal?: Proposal;
        error?: string;
      } | null;
      if (!response.ok) {
        if (response.status === 409) idempotencyKey.current = '';
        throw new Error(
          result?.error ?? `Staffing service returned ${response.status}.`,
        );
      }
      if (
        !result?.team_proposal ||
        !Array.isArray(result.team_proposal.members)
      ) {
        throw new Error(
          'The service returned an unsupported staffing proposal.',
        );
      }
      setProposal(result.team_proposal);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Staffing service unavailable.',
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-4 border-t border-white/10 pt-4">
      {existingProposals.length > 0 && (
        <section className="mb-4 rounded-2xl border border-white/10 bg-slate-950/30 p-4">
          <h3 className="font-semibold text-slate-100">
            Saved staffing proposals
          </h3>
          <ol aria-label="Saved staffing proposals" className="mt-3 space-y-3">
            {existingProposals.map((saved, index) => (
              <li
                key={saved.team.teamId}
                className="rounded-xl border border-white/10 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-cyan-100">
                    Proposal {index + 1} · {saved.team.status}
                  </span>
                  <span className="text-slate-300">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(saved.team.budgetCeilingUsd)}{' '}
                    planning ceiling
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Saved at project version {saved.projectVersion}; every role
                  still requires independent assessment.
                </p>
                <ul className="mt-2 grid gap-1 text-sm text-slate-200 sm:grid-cols-2">
                  {saved.team.members.map((member, memberIndex) => (
                    <li
                      key={`${saved.team.teamId}-${member.roleId}-${memberIndex}`}
                    >
                      {member.title}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>
      )}
      {proposal ? (
        <section
          aria-live="polite"
          className="rounded-2xl border border-cyan-200/20 bg-cyan-200/[0.04] p-4"
        >
          <h3 className="font-semibold text-cyan-100">
            Role team proposed · not activated
          </h3>
          <ul className="mt-2 grid gap-1 text-sm text-slate-200 sm:grid-cols-2">
            {proposal.members?.map((member, index) => (
              <li key={`${member.role_id ?? 'role'}-${index}`}>
                {member.title ?? 'Proposed role'}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-5 text-slate-400">
            Expertise still requires independent assessment. This proposal does
            not start agents or authorize code execution.
          </p>
        </section>
      ) : (
        <form onSubmit={submit} className="space-y-3" aria-busy={pending}>
          <label className="block max-w-xs space-y-1 text-sm">
            <span className="font-medium text-slate-200">
              Propose an SME and role team
            </span>
            <span className="block text-xs leading-5 text-slate-400">
              Set a planning budget ceiling in USD. No team member will be
              activated.
            </span>
            <span className="flex items-center rounded-xl border border-white/15 bg-slate-950/60 px-3 focus-within:outline focus-within:outline-2 focus-within:outline-cyan-300">
              <span aria-hidden="true" className="text-slate-400">
                $
              </span>
              <input
                aria-label="Planning budget ceiling in USD"
                className="min-h-11 w-full bg-transparent px-2 text-white outline-none"
                inputMode="decimal"
                min="0.01"
                name="budget"
                onChange={(event) => {
                  idempotencyKey.current = '';
                  setBudget(event.target.value);
                }}
                required
                step="0.01"
                type="number"
                value={budget}
              />
            </span>
          </label>
          <button
            className="min-h-11 rounded-xl border border-cyan-200/30 bg-cyan-200/10 px-4 text-sm font-semibold text-cyan-50 hover:bg-cyan-200/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:opacity-50"
            disabled={pending}
            type="submit"
          >
            {pending
              ? 'Saving proposal…'
              : existingProposals.length > 0
                ? 'Propose another role team'
                : 'Propose role team'}
          </button>
          {error && (
            <p className="text-sm text-amber-100" role="alert">
              {error}{' '}
              {error.includes('version changed')
                ? 'Refresh this project list before retrying.'
                : ''}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
