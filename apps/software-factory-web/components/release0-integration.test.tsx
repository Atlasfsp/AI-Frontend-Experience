import React from 'react';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { NextRequest } from 'next/server';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { createMockSession, createSignedSessionToken, sessionCookieName } from '@bac/auth';
import { GET, POST, PUT } from '@/app/api/proxy/sdx/[...path]/route';
import { callFluxCore, IdempotencyKeys } from '@/lib/fluxcore-api';
import { CreateIntake } from './create-intake';
import { ProjectWorkspace } from './project-workspace';

const descriptorPath = process.env.FLUXCORE_INTEGRATION_DESCRIPTOR;
const backendSha = process.env.FLUXCORE_INTEGRATION_BACKEND_SHA;
const frontendSha = process.env.FLUXCORE_INTEGRATION_FRONTEND_SHA;
if (process.env.FLUXCORE_INTEGRATION_REQUIRED === '1' && !descriptorPath) throw new Error('required cross-repository fixture is missing');
const nativeFetch = globalThis.fetch.bind(globalThis);
const secret = 'disposable-session-fixture-not-a-deployment-secret';
type Descriptor = { url: string; control_url: string; backend_sha: string; classification: string; execution_authorized: boolean; schema_version: number };
type Command = { method: string; path: string; body: string; key: string };
let fixture: Descriptor;
let cookie = '';
let projectId = '';
let planId = '';
let lostPath = '';
let transportDown = false;
const commands: Command[] = [];
const keys = new IdempotencyKeys();
const tenant = 'tenant-alpha';
const commit = '0123456789abcdef0123456789abcdef01234567';
const query = `tenant_id=${tenant}`;

async function control(path: string, method = 'POST') {
  const response = await nativeFetch(fixture.control_url + path, { method });
  expect(response.ok).toBe(true);
  return response;
}

async function identity(subject: string) {
  const response = await control(`identity?subject=${subject}`, 'GET');
  const token = await response.json() as { access_token: string; tenant_id: string };
  cookie = await createSignedSessionToken(createMockSession({
    authMode: 'oidc', accessToken: token.access_token, subject, tenantId: token.tenant_id,
    email: `${subject}@fixture.invalid`, name: 'Disposable test identity', roles: ['ADMIN', 'APPROVER'],
    issuer: 'release0-local-fixture',
  }), secret);
}

async function api<T = Record<string, unknown>>(method: 'GET' | 'POST' | 'PUT', path: string, body?: Record<string, unknown>) {
  return (await callFluxCore<T>(method, path, { ...(body ? { body, keys } : {}) })).data;
}

const projectPath = () => `v1/projects/${projectId}`;
const version = async () => (await api('GET', `${projectPath()}?${query}`)).version;
async function decide(formName: string, reason: string, decision?: string) {
  const form = await screen.findByRole('form', { name: formName });
  fireEvent.change(within(form).getByLabelText('Reason'), { target: { value: reason } });
  if (decision) fireEvent.change(within(form).getByLabelText('Decision'), { target: { value: decision } });
  await waitFor(() => expect((within(form).getByRole('button', { name: 'Record decision' }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(within(form).getByRole('button', { name: 'Record decision' }));
}

// This suite is mandatory when explicitly selected by the cross-repository
// runner, and skipped in ordinary offline component checks without a bridge.
// Real DOM components, signed-cookie verification, BFF, API authorization
// adapter and WAL run together. External identity/permission/source services
// are simulated, not genuine Authentik/SpiceDB/GitHub/SQL or full browser E2E.
describe.skipIf(!descriptorPath)(`AUTHOR_RUN_LOCAL_DEVELOPMENT backend=${backendSha} frontend=${frontendSha}`, () => {
  beforeAll(async () => {
    expect(backendSha).toMatch(/^[a-f0-9]{40}$/);
    expect(frontendSha).toMatch(/^[a-f0-9]{40}$/);
    fixture = JSON.parse(readFileSync(descriptorPath!, 'utf8')) as Descriptor;
    expect(fixture.backend_sha).toBe(backendSha);
    expect(fixture.classification).toBe('AUTHOR_RUN_LOCAL_DEVELOPMENT');
    expect(fixture.schema_version).toBe(11);
    expect(fixture.execution_authorized).toBe(false);
    const address = new URL(fixture.url);
    expect(address.protocol).toBe('http:');
    expect(address.hostname).toBe('127.0.0.1');
    expect(new URL(fixture.control_url).origin).toBe(address.origin);
    vi.stubGlobal('crypto', webcrypto);
    vi.stubEnv('NEXT_PUBLIC_BAC_ENV', 'staging');
    vi.stubEnv('NEXT_PUBLIC_BAC_SDX_API_URL', fixture.url);
    vi.stubEnv('BAC_SESSION_SECRET', secret);
    vi.stubGlobal('fetch', async (input: string | URL | Request, init: RequestInit = {}) => {
      const url = String(input);
      if (url.startsWith(fixture.url + '/')) {
        if (transportDown) throw new TypeError('simulated unavailable API transport');
        return nativeFetch(input, init);
      }
      if (!url.startsWith('/api/proxy/sdx/')) throw new Error('integration test refused an unapproved target');
      const target = new URL(url, 'http://frontend.fixture');
      const path = target.pathname.replace('/api/proxy/sdx/', '');
      const method = init.method ?? 'GET';
      const headers = new Headers(init.headers);
      if (cookie) headers.set('cookie', `${sessionCookieName}=${cookie}`);
      const command = { method, path, body: String(init.body ?? ''), key: headers.get('idempotency-key') ?? '' };
      if (method !== 'GET') commands.push(command);
      const request = new NextRequest(target, { method, headers, ...(typeof init.body === 'string' ? { body: init.body } : {}) });
      // Next.js decodes each catch-all segment before invoking the route handler.
      const context = { params: Promise.resolve({ path: path.split('/').map(decodeURIComponent) }) };
      const handler = { GET, POST, PUT }[method as 'GET' | 'POST' | 'PUT'];
      if (!handler) throw new Error('unsupported test method');
      const response = await handler(request, context);
      if (lostPath === path && method !== 'GET' && response.ok) {
        lostPath = '';
        await response.text();
        throw new TypeError('simulated response loss after committed write');
      }
      return response;
    });
    await identity('requester');
  });

  afterAll(async () => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    if (fixture) await control('stop');
  });

  it('connects Create → repository → intake/triage → plan/approval → staffing/decision → tasks/cancellation/audit', async () => {
    const create = render(<CreateIntake tenantId={tenant} workspaceId="fixture-workspace" />);
    fireEvent.change(screen.getByLabelText('Describe what you have in mind'), { target: { value: 'Build an accessible checkout service with durable customer orders.' } });
    fireEvent.change(screen.getByLabelText('Project name'), { target: { value: 'Integrated checkout' } });
    fireEvent.change(screen.getByLabelText('Industry or area'), { target: { value: 'Retail' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create my project' }));
    const link = await screen.findByRole('link', { name: 'Continue in FluxCore Engineer' });
    projectId = link.getAttribute('href')!.split('/').at(-1)!;
    expect((await api('GET', `${projectPath()}?${query}`)).name).toBe('Integrated checkout');
    create.unmount();
    const workspace = (subject: string) => <ProjectWorkspace projectId={projectId} tenantId={tenant} canManage canApprove subject={subject} />;
    const view = render(workspace('requester'));
    const actAs = async (subject: string) => {
      await identity(subject);
      view.rerender(workspace(subject));
    };
    fireEvent.click(await screen.findByRole('button', { name: 'Check commit' }));
    await screen.findByText(new RegExp(`Resolves to ${commit}`));
    fireEvent.click(screen.getByRole('button', { name: 'Link repository' }));
    await screen.findByText('Repository linked to the resolved commit.');
    await waitFor(() => expect(screen.getByText(`conn-a@${commit}`)).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Intake title'), { target: { value: 'Accessible checkout API' } });
    fireEvent.change(screen.getByLabelText('Requirements'), { target: { value: 'Persist orders and make checkout keyboard accessible.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit for triage' }));
    await screen.findByText('Intake saved and awaiting human triage.');
    await decide('Triage Accessible checkout API', 'Accepted for product planning');
    await screen.findByText('Intake accepted.');
    fireEvent.click(await screen.findByRole('button', { name: 'Draft engineering plan' }));
    await screen.findByText('Draft engineering plan saved.');
    const plans = await api<{ engineering_plans: Array<{ plan_id: string }> }>('GET', `${projectPath()}/engineering-plans?${query}`);
    planId = plans.engineering_plans[0]!.plan_id;
    await screen.findByText('You requested this plan. A different person must record the decision.');
    expect(screen.queryByRole('form', { name: `Decide plan ${planId}` })).toBeNull();
    // The UI explanation is advisory; the backend must still refuse the requester.
    await expect(api('POST', `${projectPath()}/engineering-plans/${planId}/decision`, {
      tenant_id: tenant, expected_version: await version(), decision: 'APPROVED', reason: 'Self-approval must be refused',
    })).rejects.toMatchObject({ status: 403 });
    expect((await api<{ engineering_plans: Array<{ status: string }> }>('GET', `${projectPath()}/engineering-plans?${query}`)).engineering_plans[0]!.status).toBe('DRAFT');
    await actAs('reviewer');
    await decide(`Decide plan ${planId}`, 'Independent human plan review');
    await screen.findByText('Plan approved.');
    await screen.findByText(/Decision reason: Independent human plan review/);
    await actAs('requester');
    const staffing = await screen.findByRole('form', { name: 'Propose staffing' });
    fireEvent.change(within(staffing).getByLabelText('Budget ceiling (USD)'), { target: { value: '2500' } });
    fireEvent.change(within(staffing).getByLabelText('Linked plan'), { target: { value: planId } });
    fireEvent.click(within(staffing).getByRole('button', { name: 'Propose team' }));
    await screen.findByText('Staffing proposal saved. No member is activated.');
    const teams = await api<{ staffing_proposals: Array<{ team_id: string }> }>('GET', `${projectPath()}/team-proposals?${query}`);
    await screen.findByText('You proposed this team. A different person must record the decision.');
    await actAs('staff-reviewer');
    await decide(`Decide team ${teams.staffing_proposals[0]!.team_id}`, 'Approve task preparation only');
    await screen.findByText('Staffing approved.');
    await actAs('task-planner');
    fireEvent.click(await screen.findByRole('button', { name: 'Create tasks' }));
    await screen.findByText('Engineering tasks created without dispatch.');
    const list = await screen.findByRole('list', { name: 'Engineering tasks' });
    const cancel = within(list).getAllByRole('form')[0]!;
    fireEvent.change(within(cancel).getByLabelText('Cancellation reason'), { target: { value: 'Requirement removed during review' } });
    fireEvent.click(within(cancel).getByRole('button', { name: 'Cancel task' }));
    await screen.findByText('Task cancelled.');
    await waitFor(() => expect(screen.getByRole('list', { name: 'Engineering tasks' }).textContent).toMatch(/Cancelled: by task-planner .*\(Requirement removed during review\)/));
    expect(screen.getByRole('list', { name: 'Engineering tasks' }).textContent).toContain('Dispatch: NOT_DISPATCHED');
    expect(within(screen.getByRole('list', { name: 'Decision events' })).getAllByText(/TASK_CANCELLED/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Recorded events only\. History from before audit recording is unavailable\. Events are not independently verified\./)).toBeTruthy();
    const events = await api<{ decision_events: Array<{ event_kind: string }> }>('GET', `${projectPath()}/decision-events?${query}`);
    expect(events.decision_events.some((event) => event.event_kind === 'TASK_CANCELLED')).toBe(true);
    const tasks = await api<{ engineering_tasks: Array<{ status: string; execution_authorized: boolean; dispatch_state: string }> }>('GET', `${projectPath()}/engineering-tasks?${query}`);
    expect(tasks.engineering_tasks.some((task) => task.status === 'CANCELLED')).toBe(true);
    expect(tasks.engineering_tasks.every((task) => !task.execution_authorized && task.dispatch_state === 'NOT_DISPATCHED')).toBe(true);
  }, 30000);

  it('denies missing/tampered sessions, cross-tenant access, backend authorization and dispatch; recovers after restart', async () => {
    const savedCookie = cookie;
    cookie = '';
    await expect(api('GET', `${projectPath()}?${query}`)).rejects.toMatchObject({ status: 403 });
    cookie = savedCookie + 'tampered';
    await expect(api('GET', `${projectPath()}?${query}`)).rejects.toMatchObject({ status: 403 });
    cookie = savedCookie;
    await expect(api('GET', `${projectPath()}?tenant_id=tenant-beta`)).rejects.toMatchObject({ status: 403 });
    await identity('foreign');
    await expect(api('GET', `${projectPath()}?tenant_id=tenant-beta`)).rejects.toMatchObject({ status: 404 });
    await identity('reader'); // Browser role ADMIN cannot override backend denial.
    await expect(api('POST', 'v1/workforce/org/staff', { tenant_id: tenant, project_id: projectId, expected_version: await version(), budget_usd: 2500 })).rejects.toMatchObject({ status: 403 });
    await identity('requester');
    await expect(api('POST', 'v1/sdlc/execute', { tenant_id: tenant, project_id: projectId })).rejects.toMatchObject({ status: 403 });
    const before = await api('GET', `${projectPath()}?${query}`);
    await control('restart');
    expect(await api('GET', `${projectPath()}?${query}`)).toEqual(before);
    const original = commands.find((command) => command.path === `${projectPath()}/engineering-plans`)!;
    const response = await callFluxCore('POST', original.path, {
      body: JSON.parse(original.body),
      keys: { keyFor: () => original.key, settle: () => undefined },
    });
    expect(response.replayed).toBe(true);
    await identity('reviewer');
    await expect(callFluxCore('POST', original.path, {
      body: JSON.parse(original.body),
      keys: { keyFor: () => original.key, settle: () => undefined },
    })).rejects.toMatchObject({ status: 409, reason: 'IDEMPOTENCY_KEY_REUSED' });
  }, 30000);

  it('retries the exact unresolved staffing command after reload without creating a duplicate proposal', async () => {
    await identity('requester');
    render(<ProjectWorkspace projectId={projectId} tenantId={tenant} canManage canApprove subject="requester" />);
    const form = await screen.findByRole('form', { name: 'Propose staffing' });
    fireEvent.change(within(form).getByLabelText('Budget ceiling (USD)'), { target: { value: '3000' } });
    fireEvent.change(within(form).getByLabelText('Linked plan'), { target: { value: planId } });
    lostPath = 'v1/workforce/org/staff';
    fireEvent.click(within(form).getByRole('button', { name: 'Propose team' }));
    await screen.findByRole('alert');
    const submitted = commands.filter((command) => command.path === lostPath || command.path === 'v1/workforce/org/staff').at(-1)!;
    const retry = await screen.findByRole('button', { name: 'Retry pending change' });
    expect((within(form).getByRole('button', { name: 'Propose team' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(retry);
    await screen.findByText(/already recorded; replayed without a second write/);
    expect(commands.filter((command) => command.path === 'v1/workforce/org/staff').at(-1)).toEqual(submitted);
    const teams = await api<{ staffing_proposals: unknown[] }>('GET', `${projectPath()}/team-proposals?${query}`);
    expect(teams.staffing_proposals).toHaveLength(2);
  }, 30000);

  it('reports service outages and offers explicit recovery without claiming success', async () => {
    await control('outage?enabled=true');
    render(<ProjectWorkspace projectId={projectId} tenantId={tenant} canManage canApprove subject="requester" />);
    await screen.findByText(/unavailable/i);
    await control('outage?enabled=false');
    fireEvent.click(screen.getByRole('button', { name: 'Reload workspace' }));
    await screen.findByText(/Shared project · version/);
    transportDown = true;
    await expect(api('GET', `${projectPath()}?${query}`)).rejects.toMatchObject({ status: 502 });
    transportDown = false;
    expect((await api('GET', `${projectPath()}?${query}`)).id).toBe(projectId);
  }, 30000);

  it('enforces human rejection and approved-plan staffing/task prerequisites', async () => {
    await identity('requester');
    const intake = await api('POST', 'v1/control-plane/intake', {
      tenant_id: tenant, project_id: projectId, title: 'Deferred requirement',
      description: 'Evaluate a separate requirement without authorizing execution.', source: 'matrix',
    });
    await api('POST', `v1/control-plane/intake/${intake.intake_id}/triage`, {
      tenant_id: tenant, expected_version: 1, decision: 'ACCEPTED', reason: 'Review the proposed scope',
    });
    const draft = await api<{ engineering_plan: { plan_id: string } }>('POST', `${projectPath()}/engineering-plans`, {
      tenant_id: tenant, expected_version: await version(), intake_id: intake.intake_id,
    });
    const draftId = draft.engineering_plan.plan_id;
    const proposal = await api<{ team_proposal: { team_id: string } }>('POST', 'v1/workforce/org/staff', {
      tenant_id: tenant, project_id: projectId, expected_version: await version(), budget_usd: 1000, engineering_plan_id: draftId,
    });
    await identity('agent');
    await expect(api('POST', `${projectPath()}/engineering-plans/${draftId}/decision`, {
      tenant_id: tenant, expected_version: await version(), decision: 'REJECTED', reason: 'An agent may not make a human decision',
    })).rejects.toMatchObject({ status: 403 });
    await identity('reviewer');
    await expect(api('POST', `${projectPath()}/team-proposals/${proposal.team_proposal.team_id}/decision`, {
      tenant_id: tenant, expected_version: await version(), decision: 'APPROVED', reason: 'A draft plan is not sufficient',
    })).rejects.toMatchObject({ status: 409 });
    await api('POST', `${projectPath()}/engineering-plans/${draftId}/decision`, {
      tenant_id: tenant, expected_version: await version(), decision: 'REJECTED', reason: 'Out of current release scope',
    });
    await expect(api('POST', 'v1/workforce/org/staff', {
      tenant_id: tenant, project_id: projectId, expected_version: await version(), budget_usd: 1000, engineering_plan_id: draftId,
    })).rejects.toMatchObject({ status: 409 });
    await expect(api('POST', `${projectPath()}/engineering-tasks`, {
      tenant_id: tenant, expected_version: await version(), engineering_plan_id: draftId, team_id: proposal.team_proposal.team_id,
    })).rejects.toMatchObject({ status: 409 });
  }, 30000);

  it('commits concurrent retries once and rejects a competing verified requester without leaking the winner', async () => {
    await identity('requester');
    const before = Number(await version());
    const body = { tenant_id: tenant, project_id: projectId, expected_version: before, budget_usd: 1500, engineering_plan_id: planId };
    const sameKey = { keyFor: () => 'matrix-concurrent-same-requester', settle: () => undefined };
    const retries = await Promise.all(Array.from({ length: 8 }, () =>
      callFluxCore<{ team_proposal: { team_id: string } }>('POST', 'v1/workforce/org/staff', { body, keys: sameKey }),
    ));
    expect(retries.filter((result) => !result.replayed)).toHaveLength(1);
    expect(new Set(retries.map((result) => result.data.team_proposal.team_id)).size).toBe(1);
    expect(await version()).toBe(before + 1);
    const ownerCookie = cookie;
    await identity('reviewer');
    const otherCookie = cookie;
    cookie = ownerCookie;
    const competingBody = JSON.stringify({ ...body, expected_version: before + 1, budget_usd: 1750 });
    const submit = (session: string) => POST(new NextRequest('http://frontend.fixture/api/proxy/sdx/v1/workforce/org/staff', {
      method: 'POST',
      headers: { cookie: `${sessionCookieName}=${session}`, 'content-type': 'application/json', 'idempotency-key': 'matrix-competing-requesters' },
      body: competingBody,
    }), { params: Promise.resolve({ path: ['v1', 'workforce', 'org', 'staff'] }) });
    const results = await Promise.all([submit(ownerCookie), submit(otherCookie)]);
    expect(results.map((response) => response.status).sort()).toEqual([201, 409]);
    const denied = results.find((response) => response.status === 409)!;
    expect(denied.headers.get('idempotent-replay')).toBeNull();
    const denial = await denied.json() as Record<string, unknown>;
    expect(Object.keys(denial).sort()).toEqual(['error', 'reason']);
    expect(denial.reason).toBe('IDEMPOTENCY_KEY_REUSED');
    expect(await version()).toBe(before + 2);
  }, 30000);
});
