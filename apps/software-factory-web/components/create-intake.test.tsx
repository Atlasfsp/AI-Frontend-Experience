import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { CreateIntake } from './create-intake';

afterEach(() => vi.unstubAllGlobals());
it('submits a custom industry and displays an unverified proposal without authorizing execution', async () => {
  const request = vi.fn().mockResolvedValue({ ok: true, json: async () => ({
    workforce_plan: { domain: 'Marine biology', evidence_status: 'UNVERIFIED', status: 'PROPOSED',
      roles: [{ role_id: 'qa', title: 'Quality engineer', capability: 'Testing', discipline: 'engineering', max_risk_tier: 'low' }],
      expert: { expert_id: 'marine', name: 'Marine SME', domain: 'Marine biology', is_verified: false },
      execution_authorized: false, required_gates: ['Verify SME expertise'] },
    estimated_cost_usd: null,
  }) });
  vi.stubGlobal('fetch', request);
  render(<CreateIntake tenantId="tenant-a" workspaceId="workspace-a" />);
  fireEvent.change(screen.getByLabelText('What would you like to build?'), { target: { value: 'A coral monitoring application' } });
  fireEvent.change(screen.getByLabelText('Application domain or industry'), { target: { value: 'Marine biology' } });
  fireEvent.click(screen.getByRole('button', { name: 'Prepare engineering proposal' }));
  await screen.findByText('Marine SME');
  expect(JSON.parse(request.mock.calls[0]?.[1].body)).toEqual({ idea_prompt: 'A coral monitoring application', application_domain: 'Marine biology' });
  expect(screen.getByText('Verify SME expertise')).toBeTruthy();
  expect(screen.getByText('Cost: unknown')).toBeTruthy();
  expect((screen.getByRole('button', { name: 'Execution blocked' }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByText('tenant-a / workspace-a')).toBeTruthy();
});
it('reports service failures without success evidence', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
  render(<CreateIntake tenantId="t" workspaceId="w" />);
  fireEvent.change(screen.getByLabelText('What would you like to build?'), { target: { value: 'A useful app' } });
  fireEvent.click(screen.getByRole('button', { name: 'Prepare engineering proposal' }));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('503'));
  expect(screen.queryByText('Workforce proposal')).toBeNull();
});
it('rejects responses that claim execution authorization or verified expertise', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ workforce_plan: { execution_authorized: true } }) }));
  render(<CreateIntake tenantId="t" workspaceId="w" />);
  fireEvent.change(screen.getByLabelText('What would you like to build?'), { target: { value: 'A useful app' } });
  fireEvent.click(screen.getByRole('button', { name: 'Prepare engineering proposal' }));
  expect((await screen.findByRole('alert')).textContent).toContain('unsupported proposal');
  expect(screen.queryByText('Workforce proposal')).toBeNull();
});
it.each([null, undefined])('treats %s cost as unknown and renders untrusted domain and expert names as text', async (cost) => {
  const unsafe = '<img src=x onerror=alert(1)>';
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({
    workforce_plan: { domain: unsafe, evidence_status: 'UNVERIFIED', status: 'PROPOSED', roles: [],
      expert: { expert_id: 'custom', name: unsafe, domain: unsafe, is_verified: false },
      execution_authorized: false, required_gates: [] }, estimated_cost_usd: cost,
  }) }));
  const { container } = render(<CreateIntake tenantId="t" workspaceId="w" />);
  fireEvent.change(screen.getByLabelText('What would you like to build?'), { target: { value: 'A useful app' } });
  fireEvent.click(screen.getByRole('button', { name: 'Prepare engineering proposal' }));
  await screen.findByText('Cost: unknown');
  expect(screen.getByRole('heading', { name: unsafe })).toBeTruthy();
  expect(container.querySelector('img')).toBeNull();
});
