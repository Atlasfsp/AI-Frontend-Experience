import React from 'react';
import type { PersistedStaffingProposal } from '@/features/projects';

/**
 * The project-list card is intentionally read-only. Its legacy inline POST
 * could create an unlinked staffing proposal with an in-memory replay key,
 * bypassing the canonical project's guarded write-fence and plan workflow.
 * The parent project card already links to the canonical Engineer workspace.
 */
export function StaffingProposal({
  existingProposals = [],
}: {
  projectId: string;
  tenantId: string;
  version: number;
  existingProposals?: PersistedStaffingProposal[];
}) {
  return (
    <div className="mt-4 border-t border-white/10 pt-4">
      {existingProposals.length > 0 && (
        <section className="mb-4 rounded-2xl border border-white/10 bg-slate-950/30 p-4">
          <h3 className="font-semibold text-slate-100">Saved staffing proposals</h3>
          <ol aria-label="Saved staffing proposals" className="mt-3 space-y-3">
            {existingProposals.map((saved, index) => (
              <li key={saved.team.teamId} className="rounded-xl border border-white/10 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2 text-sm">
                  <span className="font-medium text-cyan-100">
                    Proposal {index + 1} · {saved.team.status}
                  </span>
                  <span className="text-slate-300">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
                      .format(saved.team.budgetCeilingUsd)}{' '}planning ceiling
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Saved at project version {saved.projectVersion}; every role still
                  requires independent assessment.
                </p>
                <ul className="mt-2 grid gap-1 text-sm text-slate-200 sm:grid-cols-2">
                  {saved.team.members.map((member, memberIndex) => (
                    <li key={`${saved.team.teamId}-${member.roleId}-${memberIndex}`}>
                      {member.title}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>
      )}
      <p className="text-xs leading-6 text-slate-300">
        Staffing changes are made in the project’s Engineer workspace after
        reviewing the engineering plan. The project list is read-only:
        it cannot submit, activate or deploy a team.
      </p>
    </div>
  );
}
