import React from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { StaffingProposal } from './staffing-proposal';

afterEach(() => vi.unstubAllGlobals());

it('keeps existing staffing proposals readable without exposing an unguarded mutation shortcut', () => {
  const request = vi.fn();
  vi.stubGlobal('fetch', request);
  render(
    <StaffingProposal projectId="project-1" tenantId="tenant-a" version={4}
      existingProposals={[{
        projectVersion: 2,
        team: {
          teamId: 'team-old', budgetCeilingUsd: 2500, createdAt: '2026-10-29T01:00:00Z',
          status: 'PROPOSED',
          members: [{ roleId: 'application-domain-sme', title: 'HealthTech SME',
            seniority: 'REQUIRES_ASSESSMENT' }],
        },
      }]}
    />,
  );
  expect(screen.getByRole('list', { name: 'Saved staffing proposals' })).toBeTruthy();
  expect(screen.getByText('HealthTech SME')).toBeTruthy();
  expect(screen.getByText('$2,500.00 planning ceiling')).toBeTruthy();
  expect(screen.getByText(/Staffing changes are made in the project's Engineer workspace|Staffing changes are made in the project’s Engineer workspace/)).toBeTruthy();
  expect(screen.queryByRole('form')).toBeNull();
  expect(screen.queryByRole('button')).toBeNull();
  expect(request).not.toHaveBeenCalled();
});

it('does not issue direct project-list staffing POSTs even when no team exists', () => {
  const request = vi.fn();
  vi.stubGlobal('fetch', request);
  render(<StaffingProposal projectId="project-1" tenantId="tenant-a" version={3} />);
  expect(screen.queryByRole('form')).toBeNull();
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.getByText(/project list is read-only/)).toBeTruthy();
  expect(request).not.toHaveBeenCalled();
});
