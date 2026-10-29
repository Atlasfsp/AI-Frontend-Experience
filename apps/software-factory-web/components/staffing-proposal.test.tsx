import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { StaffingProposal } from './staffing-proposal';

afterEach(() => vi.unstubAllGlobals());

it('keeps saved staffing proposals visible after the project is reloaded', () => {
  render(
    <StaffingProposal
      projectId="project-1"
      tenantId="tenant-a"
      version={4}
      existingProposals={[
        {
          projectVersion: 2,
          team: {
            teamId: 'team-old',
            budgetCeilingUsd: 2500,
            createdAt: '2026-10-29T01:00:00Z',
            status: 'PROPOSED',
            members: [
              {
                roleId: 'application-domain-sme',
                title: 'HealthTech SME',
                seniority: 'REQUIRES_ASSESSMENT',
              },
            ],
          },
        },
      ]}
    />,
  );

  expect(
    screen.getByRole('list', { name: 'Saved staffing proposals' }),
  ).toBeTruthy();
  expect(screen.getByText('HealthTech SME')).toBeTruthy();
  expect(screen.getByText('$2,500.00 planning ceiling')).toBeTruthy();
  expect(
    screen.getByRole('button', { name: 'Propose another role team' }),
  ).toBeTruthy();
});

it('persists a budgeted project staffing proposal and clearly keeps it inactive', async () => {
  const request = vi.fn().mockResolvedValue({
    ok: true,
    status: 201,
    json: async () => ({
      team_proposal: {
        members: [{ role_id: 'application-domain-sme', title: 'Marine SME' }],
      },
    }),
  });
  vi.stubGlobal('fetch', request);
  render(
    <StaffingProposal projectId="project-1" tenantId="tenant-a" version={3} />,
  );
  fireEvent.change(screen.getByLabelText('Planning budget ceiling in USD'), {
    target: { value: '2500' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Propose role team' }));

  expect(await screen.findByText('Marine SME')).toBeTruthy();
  expect(request).toHaveBeenCalledWith(
    '/api/proxy/sdx/v1/workforce/org/staff',
    expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'Idempotency-Key': expect.any(String),
      }),
      body: JSON.stringify({
        tenant_id: 'tenant-a',
        project_id: 'project-1',
        expected_version: 3,
        budget_usd: 2500,
      }),
    }),
  );
  expect(screen.getByText('Role team proposed · not activated')).toBeTruthy();
  expect(
    screen.getByText(/does not start agents or authorize code execution/),
  ).toBeTruthy();
});

it('surfaces stale project versions without claiming that staffing succeeded', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        error:
          'project version changed; reload the project before proposing staffing',
      }),
    }),
  );
  render(
    <StaffingProposal projectId="project-1" tenantId="tenant-a" version={1} />,
  );
  fireEvent.change(screen.getByLabelText('Planning budget ceiling in USD'), {
    target: { value: '100' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Propose role team' }));
  expect((await screen.findByRole('alert')).textContent).toContain(
    'Refresh this project list before retrying.',
  );
  expect(screen.queryByText('Role team proposed · not activated')).toBeNull();
});
