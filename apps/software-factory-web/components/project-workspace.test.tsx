import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { ProjectWorkspace, validateSelection } from './project-workspace';

type Call = { method: string; url: string; body: Record<string, unknown> | null; key: string | undefined };

const sha = 'a'.repeat(40);
let calls: Call[];
let state: ReturnType<typeof initialState>;
let override: ((call: Call) => Response | undefined) | undefined;

function initialState() {
  return {
    project: { id: 'p-1', tenant_id: 'tenant-a', name: 'Farm', outcome: 'Help farmers sell produce.', application_domain: 'Marketplace', version: 2, status: 'PROPOSED', workforce_plan: { expert: { name: 'Marketplace SME' }, evidence_status: 'UNVERIFIED' } } as Record<string, unknown>,
    intakes: [{ intake_id: 'in-1', project_id: 'p-1', title: 'Seller onboarding', triage_state: 'PENDING_TRIAGE', version: 1 }] as Array<Record<string, unknown>>,
    plans: [] as Array<Record<string, unknown>>,
    proposals: [] as Array<Record<string, unknown>>,
    tasks: [] as Array<Record<string, unknown>>,
    events: [{ project_version: 2, event_kind: 'PLAN_DECIDED', resource_id: 'plan-0', from_state: 'DRAFT', to_state: 'REJECTED', actor_subject: 'user:bo', reason: 'Too broad', recorded_at: '2026-10-29T10:00:00Z' }],
  };
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function backend(call: Call): Response {
  const custom = override?.(call);
  if (custom) return custom;
  const path = call.url.replace('/api/proxy/sdx/', '').split('?')[0];
  const s = state;
  if (call.method === 'GET') {
    if (path === 'v1/projects/p-1') return json(200, s.project);
    if (path === 'v1/control-plane/intake') return json(200, { intakes: s.intakes, next_cursor: '' });
    if (path === 'v1/projects/p-1/engineering-plans') return json(200, { engineering_plans: s.plans });
    if (path === 'v1/projects/p-1/team-proposals') return json(200, { staffing_proposals: s.proposals });
    if (path === 'v1/projects/p-1/engineering-tasks') return json(200, { engineering_tasks: s.tasks });
    if (path === 'v1/projects/p-1/decision-events') return json(200, { decision_events: s.events, next_after_project_version: null, coverage: 'RECORDED_EVENTS_ONLY', legacy_history: 'UNAVAILABLE', independent_verification: 'UNVERIFIED' });
    if (path === 'v1/source-control/connections') return json(200, { tenant_id: 'tenant-a', connections: [{ id: 'conn-1', tenant_id: 'tenant-a', repository: 'farm-app', default_branch: 'main' }] });
  }
  if (call.method === 'POST' && path === 'v1/control-plane/intake/in-1/triage') {
    s.intakes = [{ ...s.intakes[0], triage_state: call.body?.decision, version: 2 }];
    return json(200, { intake: s.intakes[0], triage_event: {} });
  }
  if (call.method === 'POST' && path === 'v1/projects/p-1/engineering-plans') {
    s.project = { ...s.project, version: 3 };
    s.plans = [{ plan_id: 'plan-1', intake_id: 'in-1', status: 'DRAFT', project_version: 3, requested_by: 'user:me', execution_authorized: false, plan: { commit_sha: sha, stages: [{ stage_id: 's1', title: 'Requirements analysis', risk_tier: 'TIER_1', requires_human_approval: false, status: 'PENDING' }] } }];
    return json(201, { engineering_plan: s.plans[0], project: s.project });
  }
  if (call.method === 'POST' && path === 'v1/source-control/resolve') return json(200, { selection: call.body?.selection, commit_sha: sha, rationale: 'Resolved main' });
  if (call.method === 'PUT' && path === 'v1/projects/p-1/repository') {
    s.project = { ...s.project, version: 3, repository_ref: `conn-1@${sha}` };
    return json(200, { project: s.project, repository_link: {} });
  }
  if (call.method === 'POST' && path === 'v1/projects/p-1/engineering-tasks') {
    s.tasks = [{ task_id: 't-1', plan_id: 'plan-1', title: 'Requirements analysis', risk_tier: 'TIER_1', status: 'OPEN', state: 'BLOCKED', blocked_reasons: ['QUALIFICATION_UNVERIFIED'] }];
    return json(201, { engineering_tasks: s.tasks, project: s.project });
  }
  return json(404, { error: `unexpected ${call.method} ${path}` });
}

beforeEach(() => {
  calls = [];
  state = initialState();
  override = undefined;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit & { headers: Record<string, string> }) => {
      const call = { method: init.method ?? 'GET', url, body: init.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : null, key: init.headers['Idempotency-Key'] };
      calls.push(call);
      return backend(call);
    }),
  );
});

afterEach(() => vi.unstubAllGlobals());

const mutations = () => calls.filter((call) => call.method !== 'GET');

it('loads the project and journey records from FluxCore with the session tenant', async () => {
  render(<ProjectWorkspace projectId="p-1" tenantId="tenant-a" canManage canApprove={false} />);
  expect(await screen.findByText('Help farmers sell produce.')).toBeTruthy();
  expect(screen.getByText(/Shared project · version 2/)).toBeTruthy();
  expect(await screen.findByText('Seller onboarding')).toBeTruthy();
  expect(screen.getByText(/PLAN_DECIDED · plan-0: DRAFT → REJECTED by user:bo/)).toBeTruthy();
  const reads = calls.filter((call) => call.url.includes('tenant_id='));
  expect(reads.length).toBe(6);
  expect(reads.every((call) => call.url.includes('tenant_id=tenant-a'))).toBe(true);
  expect(calls.some((call) => call.url === '/api/proxy/sdx/v1/control-plane/intake?tenant_id=tenant-a&project_id=p-1&limit=100')).toBe(true);
});

it('triages an intake and drafts a plan using the current versions and real request bodies', async () => {
  render(<ProjectWorkspace projectId="p-1" tenantId="tenant-a" canManage canApprove={false} />);
  const triage = await screen.findByRole('form', { name: 'Triage Seller onboarding' });
  fireEvent.change(within(triage).getByLabelText('Reason'), { target: { value: 'Clear scope' } });
  fireEvent.click(within(triage).getByRole('button', { name: 'Record decision' }));
  await screen.findByText('Intake accepted.');
  expect(mutations()[0]).toMatchObject({
    method: 'POST',
    url: '/api/proxy/sdx/v1/control-plane/intake/in-1/triage',
    body: { tenant_id: 'tenant-a', expected_version: 1, decision: 'ACCEPTED', reason: 'Clear scope' },
  });
  expect(mutations()[0]?.key?.length).toBeGreaterThanOrEqual(8);

  fireEvent.click(await screen.findByRole('button', { name: 'Draft engineering plan' }));
  await screen.findByText('Draft engineering plan saved.');
  expect(mutations()[1]).toMatchObject({
    url: '/api/proxy/sdx/v1/projects/p-1/engineering-plans',
    body: { tenant_id: 'tenant-a', expected_version: 2, intake_id: 'in-1' },
  });
  expect(await screen.findByText(/Shared project · version 3/)).toBeTruthy();
  expect(screen.getByText('Plan plan-1 · DRAFT')).toBeTruthy();
  expect(screen.queryByRole('form', { name: 'Decide plan plan-1' })).toBeNull();
});

it('requires acknowledgement before accepting a quarantined intake', async () => {
  state.intakes = [{ intake_id: 'in-1', project_id: 'p-1', title: 'Risky', triage_state: 'QUARANTINED_REQUIRES_REVIEW', version: 1, warning: 'Matched heuristic pattern' }];
  render(<ProjectWorkspace projectId="p-1" tenantId="tenant-a" canManage canApprove={false} />);
  const triage = await screen.findByRole('form', { name: 'Triage Risky' });
  fireEvent.change(within(triage).getByLabelText('Reason'), { target: { value: 'Reviewed' } });
  const submit = within(triage).getByRole('button', { name: 'Record decision' }) as HTMLButtonElement;
  expect(submit.disabled).toBe(true);
  fireEvent.click(within(triage).getByRole('checkbox'));
  fireEvent.click(submit);
  await screen.findByText('Intake accepted.');
  expect(mutations()[0]?.body).toMatchObject({ acknowledge_heuristic_warning: true });
});

it('reloads after a stale version conflict and shows the backend failure instead of success', async () => {
  state.plans = [{ plan_id: 'plan-1', intake_id: 'in-1', status: 'DRAFT', project_version: 2, plan: { commit_sha: '', stages: [] } }];
  override = (call) => (call.method === 'POST' ? json(409, { error: 'project version changed or decision is already final' }) : undefined);
  render(<ProjectWorkspace projectId="p-1" tenantId="tenant-a" canManage canApprove />);
  const decide = await screen.findByRole('form', { name: 'Decide plan plan-1' });
  fireEvent.change(within(decide).getByLabelText('Reason'), { target: { value: 'Looks right' } });
  const readsBefore = calls.filter((call) => call.method === 'GET').length;
  fireEvent.click(within(decide).getByRole('button', { name: 'Record decision' }));
  expect((await screen.findByRole('alert')).textContent).toContain('project version changed');
  expect(mutations()[0]).toMatchObject({
    url: '/api/proxy/sdx/v1/projects/p-1/engineering-plans/plan-1/decision',
    body: { tenant_id: 'tenant-a', expected_version: 2, decision: 'APPROVED', reason: 'Looks right' },
  });
  await waitFor(() => expect(calls.filter((call) => call.method === 'GET').length).toBeGreaterThan(readsBefore));
  expect(screen.queryByText('Plan approved.')).toBeNull();
});

it('reuses the same Idempotency-Key when retrying after the backend is not connected', async () => {
  let attempts = 0;
  override = (call) => {
    if (call.method === 'POST' && call.url.endsWith('/triage') && attempts++ === 0) return json(503, { status: 'NOT_CONNECTED', error: 'persistence unavailable' });
    return undefined;
  };
  render(<ProjectWorkspace projectId="p-1" tenantId="tenant-a" canManage canApprove={false} />);
  const triage = await screen.findByRole('form', { name: 'Triage Seller onboarding' });
  fireEvent.change(within(triage).getByLabelText('Reason'), { target: { value: 'Clear scope' } });
  fireEvent.click(within(triage).getByRole('button', { name: 'Record decision' }));
  expect((await screen.findByRole('alert')).textContent).toContain('outcome is unconfirmed');
  expect(screen.getByRole('alert').textContent).not.toContain('Nothing was saved');
  await waitFor(() => expect((within(triage).getByRole('button', { name: 'Record decision' }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(within(triage).getByRole('button', { name: 'Record decision' }));
  await screen.findByText('Intake accepted.');
  expect(mutations()).toHaveLength(2);
  expect(mutations()[0]?.key).toBe(mutations()[1]?.key);
});

it('links a repository only after the server resolves the selection, sending the resolved commit as a check', async () => {
  render(<ProjectWorkspace projectId="p-1" tenantId="tenant-a" canManage canApprove={false} />);
  const form = await screen.findByRole('form', { name: 'Repository selection' });
  expect((within(form).getByRole('button', { name: 'Link repository' }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(within(form).getByLabelText('Scope'), { target: { value: 'branch' } });
  fireEvent.change(within(form).getByLabelText('Branch or tag'), { target: { value: 'main' } });
  fireEvent.click(within(form).getByRole('button', { name: 'Check commit' }));
  expect(await screen.findByText(new RegExp(`Resolves to ${sha}`))).toBeTruthy();
  expect(mutations()[0]).toMatchObject({ url: '/api/proxy/sdx/v1/source-control/resolve', body: { tenant_id: 'tenant-a', selection: { connection_id: 'conn-1', scope: { kind: 'branch', reference: 'main' } } } });
  fireEvent.click(within(form).getByRole('button', { name: 'Link repository' }));
  await screen.findByText('Repository linked to the resolved commit.');
  expect(mutations()[1]).toMatchObject({
    method: 'PUT',
    url: '/api/proxy/sdx/v1/projects/p-1/repository',
    body: { tenant_id: 'tenant-a', expected_version: 2, source_selection: { connection_id: 'conn-1', scope: { kind: 'branch', reference: 'main' } }, commit_sha: sha },
  });
  expect(await screen.findByText(`conn-1@${sha}`)).toBeTruthy();
});

it('validates source selections before contacting the resolver', () => {
  expect(validateSelection({ connection_id: 'c', scope: { kind: 'path', reference: 'main', path: '../etc' } })).toMatch(/inside the repository/);
  expect(validateSelection({ connection_id: 'c', scope: { kind: 'path', reference: 'main', path: '/srv/app' } })).toMatch(/inside the repository/);
  expect(validateSelection({ connection_id: 'c', scope: { kind: 'commit', reference: 'abc' } })).toMatch(/full 40 or 64/);
  expect(validateSelection({ connection_id: '', scope: { kind: 'repository' } })).toMatch(/connection/);
  expect(validateSelection({ connection_id: 'c', scope: { kind: 'path', reference: 'main', path: 'services/api' } })).toBeNull();
});

it('creates tasks only for an approved plan with an approved linked team and shows backlog state', async () => {
  state.plans = [{ plan_id: 'plan-1', intake_id: 'in-1', status: 'APPROVED', project_version: 3, plan: { commit_sha: sha, stages: [] } }];
  state.proposals = [
    { team_id: 'team-1', project_version: 4, engineering_plan_id: 'plan-1', decision_status: 'APPROVED', activation_state: 'NOT_ACTIVATED', execution_readiness: { blocked_reasons: ['QUALIFICATION_UNVERIFIED', 'EXECUTION_BOUNDARY_UNQUALIFIED'] }, team: { members: [{ role_id: 'qa', title: 'Quality engineer' }] } },
    { team_id: 'team-2', project_version: 4, engineering_plan_id: 'plan-1', decision_status: 'REJECTED', activation_state: 'NOT_ACTIVATED', execution_readiness: { blocked_reasons: ['A', 'B'] }, team: {} },
  ];
  state.project = { ...state.project, version: 5 };
  render(<ProjectWorkspace projectId="p-1" tenantId="tenant-a" canManage canApprove={false} />);
  const form = await screen.findByRole('form', { name: 'Create engineering tasks' });
  expect(within(form).getAllByRole('option')).toHaveLength(1);
  fireEvent.click(within(form).getByRole('button', { name: 'Create tasks' }));
  await screen.findByText('Engineering tasks created without dispatch.');
  expect(mutations()[0]).toMatchObject({ url: '/api/proxy/sdx/v1/projects/p-1/engineering-tasks', body: { tenant_id: 'tenant-a', expected_version: 5, engineering_plan_id: 'plan-1', team_id: 'team-1' } });
  expect(await screen.findByText('Requirements analysis · BLOCKED')).toBeTruthy();
});

it('hides mutation controls from read-only sessions', async () => {
  state.plans = [{ plan_id: 'plan-1', intake_id: 'in-1', status: 'DRAFT', project_version: 2, plan: { commit_sha: '', stages: [] } }];
  render(<ProjectWorkspace projectId="p-1" tenantId="tenant-a" canManage={false} canApprove={false} />);
  await screen.findByText('Seller onboarding');
  expect(screen.queryByRole('form')).toBeNull();
  expect(screen.queryByRole('button')).toBeNull();
  expect(calls.some((call) => call.url.includes('source-control'))).toBe(false);
});

it('refuses a project returned for another tenant', async () => {
  state.project = { ...state.project, tenant_id: 'tenant-b' };
  render(<ProjectWorkspace projectId="p-1" tenantId="tenant-a" canManage canApprove />);
  expect((await screen.findByRole('status')).textContent).toContain('unsupported response');
  expect(screen.queryByText('Help farmers sell produce.')).toBeNull();
});

it('reports a missing or cross-tenant project without rendering actions', async () => {
  override = (call) => (call.url.startsWith('/api/proxy/sdx/v1/projects/p-1?') ? json(404, { error: 'project not found' }) : undefined);
  render(<ProjectWorkspace projectId="p-1" tenantId="tenant-a" canManage canApprove />);
  expect((await screen.findByRole('status')).textContent).toContain('not found in your tenant');
  expect(screen.queryByRole('form')).toBeNull();
});
