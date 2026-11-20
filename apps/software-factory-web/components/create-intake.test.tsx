import React from 'react';
import { webcrypto } from 'node:crypto';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CreateIntake } from './create-intake';

beforeEach(() => {
  vi.stubGlobal('crypto', webcrypto);
  window.localStorage.clear();
});
afterEach(() => vi.unstubAllGlobals());
it('carries a dashboard idea into the Create form without creating a project early', () => {
  const request = vi.fn();
  vi.stubGlobal('fetch', request);
  render(
    <CreateIntake subject="user:me"
      tenantId="tenant-a"
      workspaceId="workspace-a"
      initialIdea="Build an accessible booking calendar"
    />,
  );

  expect(
    (
      screen.getByLabelText(
        'Describe what you have in mind',
      ) as HTMLTextAreaElement
    ).value,
  ).toBe('Build an accessible booking calendar');
  expect(request).not.toHaveBeenCalled();
});

it('lets a first-time builder start from one plain-language idea and suggests the general SME path', async () => {
  const project = {
    id: 'project-quick',
    tenant_id: 'tenant-a',
    name: 'I want to make',
    status: 'PROPOSED',
    workforce_plan: {
      domain: 'General software — SME classification pending',
      evidence_status: 'UNVERIFIED',
      status: 'PROPOSED',
      roles: [],
      expert: {
        expert_id: 'general',
        name: 'General software SME',
        domain: 'General software',
        is_verified: false,
      },
      execution_authorized: false,
      required_gates: [],
    },
    estimated_cost_usd: null,
  };
  const request = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => project });
  vi.stubGlobal('fetch', request);
  render(<CreateIntake subject="user:me" tenantId="tenant-a" workspaceId="workspace-a" />);
  fireEvent.change(screen.getByLabelText('Describe what you have in mind'), {
    target: { value: 'I want to make a neighborhood garden planner' },
  });
  await waitFor(() => expect((screen.getByRole('button', { name: 'Create my project' }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(screen.getByRole('button', { name: 'Create my project' }));
  await screen.findByText('General software SME');
  expect(JSON.parse(request.mock.calls[0]?.[1].body)).toEqual({
    tenant_id: 'tenant-a',
    name: 'I want to make a',
    outcome: 'I want to make a neighborhood garden planner',
    application_domain: 'General software — SME classification pending',
  });
  expect(
    screen
      .getByRole('link', { name: 'Open FluxCore Engineer →' })
      .getAttribute('href'),
  ).toBe('/software-factory/workspaces');
});

it('fills a conversational starter and its SME context without submitting', async () => {
  const request = vi.fn();
  vi.stubGlobal('fetch', request);
  render(<CreateIntake subject="user:me" tenantId="tenant-a" workspaceId="workspace-a" />);
  const starter = screen.getByRole('button', { name: /A simple online shop/ }) as HTMLButtonElement;
  // Edits stay disabled until the verified-scope write fence is ready.
  await waitFor(() => expect(starter.disabled).toBe(false));
  fireEvent.click(starter);
  expect(request).not.toHaveBeenCalled();
  expect(
    (
      screen.getByLabelText(
        'Describe what you have in mind',
      ) as HTMLTextAreaElement
    ).value,
  ).toContain('online shop');
  expect(
    (screen.getByLabelText('Project name') as HTMLInputElement).value,
  ).toBe('Online shop');
  expect(
    (screen.getByLabelText('Industry or area') as HTMLInputElement).value,
  ).toBe('E-commerce');
});

it('creates a shared tenant project and displays its unverified workforce proposal without authorizing execution', async () => {
  const request = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      id: 'project-1',
      tenant_id: 'tenant-a',
      name: 'Coral monitor',
      status: 'PROPOSED',
      workforce_plan: {
        domain: 'Marine biology',
        evidence_status: 'UNVERIFIED',
        status: 'PROPOSED',
        roles: [
          {
            role_id: 'qa',
            title: 'Quality engineer',
            capability: 'Testing',
            discipline: 'engineering',
            max_risk_tier: 'low',
          },
        ],
        expert: {
          expert_id: 'marine',
          name: 'Marine SME',
          domain: 'Marine biology',
          is_verified: false,
        },
        execution_authorized: false,
        required_gates: ['Verify SME expertise'],
      },
      estimated_cost_usd: null,
    }),
  });
  vi.stubGlobal('fetch', request);
  render(<CreateIntake subject="user:me" tenantId="tenant-a" workspaceId="workspace-a" />);
  fireEvent.change(screen.getByLabelText('Describe what you have in mind'), {
    target: { value: 'A coral monitoring application' },
  });
  fireEvent.change(screen.getByLabelText('Project name'), {
    target: { value: 'Coral monitor' },
  });
  fireEvent.change(screen.getByLabelText('Industry or area'), {
    target: { value: 'Marine biology' },
  });
  await waitFor(() => expect((screen.getByRole('button', { name: 'Create my project' }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(screen.getByRole('button', { name: 'Create my project' }));
  await screen.findByText('Marine SME');
  expect(request.mock.calls[0]?.[0]).toBe('/api/proxy/sdx/v1/projects');
  expect(JSON.parse(request.mock.calls[0]?.[1].body)).toEqual({
    tenant_id: 'tenant-a',
    name: 'Coral monitor',
    outcome: 'A coral monitoring application',
    application_domain: 'Marine biology',
  });
  expect(
    request.mock.calls[0]?.[1].headers['Idempotency-Key'].length,
  ).toBeGreaterThanOrEqual(8);
  expect(screen.getByText('Verify SME expertise')).toBeTruthy();
  expect(screen.getByText('Cost: unknown until measured')).toBeTruthy();
  expect(screen.getByText('Execution remains blocked.')).toBeTruthy();
  expect(
    screen
      .getByRole('link', { name: 'Continue in FluxCore Engineer' })
      .getAttribute('href'),
  ).toBe('/software-factory/workspaces/project-1');
  expect(screen.getByText('Shared project ID: project-1')).toBeTruthy();
  expect(
    screen.getByText(
      'Workspace: workspace-a · Project and engineering state are shared with FluxCore Engineer.',
    ),
  ).toBeTruthy();
  expect(
    screen
      .getByRole('link', { name: 'Open FluxCore Engineer →' })
      .getAttribute('href'),
  ).toBe('/software-factory/workspaces');
});
it('reports service failures without success evidence', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
  render(<CreateIntake subject="user:me" tenantId="t" workspaceId="w" />);
  fireEvent.change(screen.getByLabelText('Describe what you have in mind'), {
    target: { value: 'A useful app' },
  });
  fireEvent.change(screen.getByLabelText('Project name'), {
    target: { value: 'Useful app' },
  });
  fireEvent.change(screen.getByLabelText('Industry or area'), {
    target: { value: 'Education' },
  });
  await waitFor(() => expect((screen.getByRole('button', { name: 'Create my project' }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(screen.getByRole('button', { name: 'Create my project' }));
  await waitFor(() =>
    expect(screen.getByRole('alert').textContent).toContain('503'),
  );
  expect(screen.queryByText('Workforce proposal')).toBeNull();
});
it('rejects a project response from a different tenant', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'project-other',
        tenant_id: 'tenant-b',
        name: 'Other tenant project',
        status: 'PROPOSED',
        estimated_cost_usd: null,
        workforce_plan: {
          domain: 'Education',
          evidence_status: 'UNVERIFIED',
          status: 'PROPOSED',
          roles: [],
          expert: {
            expert_id: 'edu',
            name: 'Education SME',
            domain: 'Education',
            is_verified: false,
          },
          execution_authorized: false,
          required_gates: [],
        },
      }),
    }),
  );
  render(<CreateIntake subject="user:me" tenantId="tenant-a" workspaceId="workspace-a" />);
  fireEvent.change(screen.getByLabelText('Describe what you have in mind'), {
    target: { value: 'A useful app' },
  });
  fireEvent.change(screen.getByLabelText('Project name'), {
    target: { value: 'Useful app' },
  });
  fireEvent.change(screen.getByLabelText('Industry or area'), {
    target: { value: 'Education' },
  });
  await waitFor(() => expect((screen.getByRole('button', { name: 'Create my project' }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(screen.getByRole('button', { name: 'Create my project' }));
  expect((await screen.findByRole('alert')).textContent).toContain(
    'different tenant',
  );
  expect(screen.queryByText('Shared project ID: project-other')).toBeNull();
});
it('rejects responses that claim execution authorization or verified expertise', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({ workforce_plan: { execution_authorized: true } }),
      }),
  );
  render(<CreateIntake subject="user:me" tenantId="t" workspaceId="w" />);
  fireEvent.change(screen.getByLabelText('Describe what you have in mind'), {
    target: { value: 'A useful app' },
  });
  fireEvent.change(screen.getByLabelText('Project name'), {
    target: { value: 'Useful app' },
  });
  fireEvent.change(screen.getByLabelText('Industry or area'), {
    target: { value: 'Education' },
  });
  await waitFor(() => expect((screen.getByRole('button', { name: 'Create my project' }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(screen.getByRole('button', { name: 'Create my project' }));
  expect((await screen.findByRole('alert')).textContent).toContain(
    'unsupported project',
  );
  expect(screen.queryByText('Workforce proposal')).toBeNull();
});
it('treats cost as unknown and renders untrusted domain and expert names as text', async () => {
  const unsafe = '<img src=x onerror=alert(1)>';
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        workforce_plan: {
          domain: unsafe,
          evidence_status: 'UNVERIFIED',
          status: 'PROPOSED',
          roles: [],
          expert: {
            expert_id: 'custom',
            name: unsafe,
            domain: unsafe,
            is_verified: false,
          },
          execution_authorized: false,
          required_gates: [],
        },
        estimated_cost_usd: null,
      }),
    }),
  );
  const { container } = render(<CreateIntake subject="user:me" tenantId="t" workspaceId="w" />);
  fireEvent.change(screen.getByLabelText('Describe what you have in mind'), {
    target: { value: 'A useful app' },
  });
  fireEvent.change(screen.getByLabelText('Project name'), {
    target: { value: 'Useful app' },
  });
  fireEvent.change(screen.getByLabelText('Industry or area'), {
    target: { value: 'Education' },
  });
  const request = vi
    .fn()
    .mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'p-1',
        tenant_id: 't',
        name: 'Useful app',
        status: 'PROPOSED',
        estimated_cost_usd: null,
        workforce_plan: {
          domain: unsafe,
          evidence_status: 'UNVERIFIED',
          status: 'PROPOSED',
          roles: [],
          expert: {
            expert_id: 'custom',
            name: unsafe,
            domain: unsafe,
            is_verified: false,
          },
          execution_authorized: false,
          required_gates: [],
        },
      }),
    });
  vi.stubGlobal('fetch', request);
  await waitFor(() => expect((screen.getByRole('button', { name: 'Create my project' }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(screen.getByRole('button', { name: 'Create my project' }));
  await screen.findByText('Shared project ID: p-1');
  expect(screen.getByText('Cost: unknown until measured')).toBeTruthy();
  expect(screen.getByRole('heading', { name: unsafe })).toBeTruthy();
  expect(container.querySelector('img')).toBeNull();
});

it('reuses the original project-create body and key after an ambiguous 503 without duplicate creation', async () => {
  const project = {
    id: 'project-replayed',
    tenant_id: 'tenant-a',
    name: 'Careful builder',
    status: 'PROPOSED',
    workforce_plan: {
      domain: 'Education',
      evidence_status: 'UNVERIFIED',
      status: 'PROPOSED',
      roles: [],
      expert: {
        expert_id: 'general',
        name: 'General software SME',
        domain: 'Education',
        is_verified: false,
      },
      execution_authorized: false,
      required_gates: [],
    },
    estimated_cost_usd: null,
  };
  const request = vi.fn()
    .mockResolvedValueOnce({ ok: false, status: 503 })
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => project });
  vi.stubGlobal('fetch', request);
  render(<CreateIntake subject="user:me" tenantId="tenant-a" workspaceId="workspace-a" />);
  fireEvent.change(screen.getByLabelText('Describe what you have in mind'), {
    target: { value: 'Create a careful builder' },
  });
  await waitFor(() => expect((screen.getByRole('button', { name: 'Create my project' }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(screen.getByRole('button', { name: 'Create my project' }));
  expect((await screen.findByRole('alert')).textContent).toContain('unconfirmed');
  expect((screen.getByRole('button', { name: 'Create my project' }) as HTMLButtonElement).disabled).toBe(true);
  const retry = screen.getByRole('button', { name: 'Retry pending project creation' });
  expect(window.localStorage.length).toBe(1);
  fireEvent.click(retry);
  await screen.findByText('Shared project ID: project-replayed');
  expect(request).toHaveBeenCalledTimes(2);
  expect(request.mock.calls[1][1].headers['Idempotency-Key']).toBe(request.mock.calls[0][1].headers['Idempotency-Key']);
  expect(request.mock.calls[1][1].body).toBe(request.mock.calls[0][1].body);
  expect(window.localStorage.length).toBe(0);
  expect((screen.getByRole('button', { name: 'Create my project' }) as HTMLButtonElement).disabled).toBe(true);
});

it('persists only an opaque creation marker and fails closed on remount after an ambiguous write', async () => {
  const request = vi.fn().mockRejectedValue(new TypeError('connection lost after commit'));
  vi.stubGlobal('fetch', request);
  const mounted = render(<CreateIntake subject="user:me" tenantId="tenant-a" workspaceId="workspace-a" />);
  fireEvent.change(screen.getByLabelText('Describe what you have in mind'), {
    target: { value: 'Create a private education portal' },
  });
  await waitFor(() => expect((screen.getByRole('button', { name: 'Create my project' }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(screen.getByRole('button', { name: 'Create my project' }));
  await screen.findByRole('button', { name: 'Retry pending project creation' });
  expect(window.localStorage.length).toBe(1);
  const stored = Array.from({ length: window.localStorage.length }, (_, index) => {
    const key = window.localStorage.key(index)!;
    return key + window.localStorage.getItem(key);
  }).join(' ');
  expect(stored).toMatch(/fluxcore:r0:write-fence:v1:/);
  expect(stored).not.toMatch(/private education|user:me|tenant-a|workspace-a|Idempotency-Key|access.token/);
  mounted.unmount();
  render(<CreateIntake subject="user:me" tenantId="tenant-a" workspaceId="workspace-a" />);
  await waitFor(() => expect((screen.getByRole('button', { name: 'Create my project' }) as HTMLButtonElement).disabled).toBe(true));
  expect((await screen.findByRole('alert')).textContent).toContain('New creations are blocked');
  expect(screen.queryByRole('button', { name: 'Retry pending project creation' })).toBeNull();
  expect(request).toHaveBeenCalledTimes(1);
});

it('keeps the exact create key after unreadable 201 and expired-session 401 on retry', async () => {
  const project = {
    id: 'created-before-response-loss', tenant_id: 'tenant-a', name: 'Secure create',
    status: 'PROPOSED',
    workforce_plan: {
      domain: 'Education', evidence_status: 'UNVERIFIED', status: 'PROPOSED', roles: [],
      expert: { expert_id: 'e', name: 'Education SME', domain: 'Education', is_verified: false },
      execution_authorized: false, required_gates: [],
    },
  };
  const request = vi.fn()
    .mockResolvedValueOnce({
      ok: true, status: 201,
      json: async () => { throw new SyntaxError('response truncated'); },
    })
    .mockResolvedValueOnce({ ok: false, status: 401 })
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => project });
  vi.stubGlobal('fetch', request);
  render(<CreateIntake subject="user:me" tenantId="tenant-a" workspaceId="workspace-a" />);
  fireEvent.change(screen.getByLabelText('Describe what you have in mind'), {
    target: { value: 'Secure project create with recovery' },
  });
  await waitFor(() => expect((screen.getByRole('button', { name: 'Create my project' }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(screen.getByRole('button', { name: 'Create my project' }));
  await screen.findByRole('button', { name: 'Retry pending project creation' });
  fireEvent.click(screen.getByRole('button', { name: 'Retry pending project creation' }));
  await waitFor(() => expect((screen.getByRole('alert').textContent ?? '')).toContain('401'));
  expect(window.localStorage.length).toBe(1);
  fireEvent.click(screen.getByRole('button', { name: 'Retry pending project creation' }));
  await screen.findByText('Shared project ID: created-before-response-loss');
  expect(request).toHaveBeenCalledTimes(3);
  const firstKey = request.mock.calls[0][1].headers['Idempotency-Key'];
  for (const call of request.mock.calls.slice(1)) {
    expect(call[1].headers['Idempotency-Key']).toBe(firstKey);
    expect(call[1].body).toBe(request.mock.calls[0][1].body);
  }
  expect(window.localStorage.length).toBe(0);
});
