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
  expect(resolveSdxPermission('GET', ['v1', 'runs', 'run-1'])).toBe('workspace:view');
  expect(resolveSdxPermission('POST', ['v1', 'releases', 'webhooks', 'jenkins'])).toBeNull();
  expect(resolveSdxPermission('GET', ['v1', 'activation'])).toBeNull();
  expect(resolveSdxPermission('DELETE', ['v1', 'projects'])).toBeNull();
  expect(resolveSdxPermission('POST', ['v1', 'projects', '..', 'admin'])).toBeNull();
  expect(resolveSdxPermission('GET', ['v1', 'runs', '..'])).toBeNull();
});
