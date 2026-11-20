import { expect, it } from 'vitest';
import { createMockSession, hasPermission } from '@bac/auth';
import { resolveSdxPermission } from './sdx-permissions';

it('requires planning permission for compile and denies anonymous and viewer sessions', () => {
  const permission = resolveSdxPermission('POST', ['v1', 'activation', 'compiler', 'compile']);
  if (!permission) throw new Error('activation compile must be exposed with an explicit permission');
  expect(permission).toBe('workspace:manage');
  expect(hasPermission(null, permission)).toBe(false);
  expect(hasPermission(createMockSession({ roles: ['VIEWER'] }), permission)).toBe(false);
  expect(hasPermission(createMockSession({ roles: ['ADMIN'] }), permission)).toBe(true);
});
it('uses the operation-specific permission for project and approval workflows', () => {
  expect(resolveSdxPermission('POST', ['v1', 'projects'])).toBe('workspace:manage');
  expect(resolveSdxPermission('POST', ['v1', 'control-plane', 'approvals', 'approval-1', 'sign'])).toBe('approval:action');
  expect(resolveSdxPermission('POST', ['v1', 'releases', 'promote'])).toBe('application:deploy');
  expect(resolveSdxPermission('POST', ['v1', 'control-plane', 'kill-switch'])).toBe('application:rollback');
});

it('allows only backend routes explicitly exposed to the web BFF', () => {
  expect(resolveSdxPermission('GET', ['v1', 'frontend', 'providers'])).toBe('workspace:view');
  expect(resolveSdxPermission('GET', ['v1', 'admin', 'agentgateway', 'status'])).toBe('workspace:manage');
  expect(resolveSdxPermission('POST', ['v1', 'admin', 'agentgateway', 'status'])).toBeNull();
  expect(resolveSdxPermission('GET', ['v1', 'runs', 'run-1'])).toBe('workspace:view');
  expect(resolveSdxPermission('POST', ['v1', 'releases', 'webhooks', 'jenkins'])).toBeNull();
  expect(resolveSdxPermission('GET', ['v1', 'activation'])).toBeNull();
  expect(resolveSdxPermission('DELETE', ['v1', 'projects'])).toBeNull();
  expect(resolveSdxPermission('POST', ['v1', 'projects', '..', 'admin'])).toBeNull();
  expect(resolveSdxPermission('GET', ['v1', 'runs', '..'])).toBeNull();
});

it('exposes tenant-scoped source-control browsing and governed scope resolution', () => {
  expect(resolveSdxPermission('GET', ['v1', 'source-control', 'connections'])).toBe('workspace:view');
  expect(resolveSdxPermission('POST', ['v1', 'source-control', 'resolve'])).toBe('workspace:manage');
  expect(resolveSdxPermission('DELETE', ['v1', 'source-control', 'connections'])).toBeNull();
});

it('exposes the Release 0 project journey with operation-specific permissions', () => {
  const p = ['v1', 'projects', 'p-1'];
  expect(resolveSdxPermission('GET', p)).toBe('workspace:view');
  expect(resolveSdxPermission('PUT', [...p, 'repository'])).toBe('workspace:manage');
  expect(resolveSdxPermission('GET', [...p, 'engineering-plans'])).toBe('workspace:view');
  expect(resolveSdxPermission('POST', [...p, 'engineering-plans'])).toBe('workspace:manage');
  expect(resolveSdxPermission('POST', [...p, 'engineering-plans', 'plan-1', 'decision'])).toBe('approval:action');
  expect(resolveSdxPermission('GET', [...p, 'team-proposals'])).toBe('workspace:view');
  expect(resolveSdxPermission('POST', [...p, 'team-proposals', 'team-1', 'decision'])).toBe('approval:action');
  expect(resolveSdxPermission('GET', [...p, 'engineering-tasks'])).toBe('workspace:view');
  expect(resolveSdxPermission('POST', [...p, 'engineering-tasks'])).toBe('workspace:manage');
  expect(resolveSdxPermission('POST', [...p, 'engineering-tasks', 'task:plan-1:stage-1', 'cancel'])).toBe('workspace:manage');
  expect(resolveSdxPermission('GET', [...p, 'decision-events'])).toBe('workspace:view');
  expect(resolveSdxPermission('GET', ['v1', 'control-plane', 'intake'])).toBe('workspace:view');
  expect(resolveSdxPermission('GET', ['v1', 'control-plane', 'intake', 'intake-1'])).toBe('workspace:view');
  expect(resolveSdxPermission('POST', ['v1', 'control-plane', 'intake', 'intake-1', 'triage'])).toBe('workspace:manage');
});

it('rejects other methods and malformed segments on project journey routes', () => {
  const p = ['v1', 'projects', 'p-1'];
  expect(resolveSdxPermission('POST', [...p, 'repository'])).toBeNull();
  expect(resolveSdxPermission('PUT', p)).toBeNull();
  expect(resolveSdxPermission('DELETE', [...p, 'engineering-tasks'])).toBeNull();
  expect(resolveSdxPermission('GET', [...p, 'engineering-plans', 'plan-1', 'decision'])).toBeNull();
  expect(resolveSdxPermission('PUT', [...p, 'engineering-plans'])).toBeNull();
  expect(resolveSdxPermission('POST', [...p, 'engineering-tasks', 'task-1', 'complete'])).toBeNull();
  expect(resolveSdxPermission('POST', [...p, 'engineering-tasks', 'task-1', 'dispatch'])).toBeNull();
  expect(resolveSdxPermission('GET', ['v1', 'projects', '..'])).toBeNull();
  expect(resolveSdxPermission('PUT', ['v1', 'projects', '.hidden', 'repository'])).toBeNull();
  expect(resolveSdxPermission('PUT', ['v1', 'projects', 'p/1', 'repository'])).toBeNull();
  expect(resolveSdxPermission('GET', ['v1', 'projects', 'x'.repeat(129)])).toBeNull();
});

it('keeps approval decisions away from roles without approval:action', () => {
  const permission = resolveSdxPermission('POST', ['v1', 'projects', 'p-1', 'engineering-plans', 'plan-1', 'decision']);
  if (!permission) throw new Error('plan decisions must be allowlisted');
  expect(hasPermission(createMockSession({ roles: ['ADMIN'] }), permission)).toBe(false);
  expect(hasPermission(createMockSession({ roles: ['MEMBER'] }), permission)).toBe(false);
  expect(hasPermission(createMockSession({ roles: ['APPROVER'] }), permission)).toBe(true);
});

it('exposes read-only command outcome recovery without exposing mutations on those paths', () => {
  expect(resolveSdxPermission('GET', ['v1', 'projects', 'command-outcome'])).toBe('workspace:view');
  expect(resolveSdxPermission('GET', ['v1', 'control-plane', 'intake', 'command-outcome'])).toBe('workspace:view');
  expect(resolveSdxPermission('POST', ['v1', 'projects', 'command-outcome', 'extra'])).toBeNull();
  expect(resolveSdxPermission('PUT', ['v1', 'control-plane', 'intake', 'command-outcome'])).toBeNull();
});
