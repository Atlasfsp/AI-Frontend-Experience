import { expect, it } from 'vitest';
import { createMockSession, hasPermission } from '@bac/auth';
import { resolveSdxPermission } from './sdx-permissions';

it('requires planning permission for compile and denies anonymous and viewer sessions', () => {
  const permission = resolveSdxPermission('POST', ['v1', 'activation', 'compiler', 'compile']);
  expect(permission).toBe('workspace:manage');
  expect(hasPermission(null, permission)).toBe(false);
  expect(hasPermission(createMockSession({ roles: ['VIEWER'] }), permission)).toBe(false);
  expect(hasPermission(createMockSession({ roles: ['ADMIN'] }), permission)).toBe(true);
});
it('keeps deployment authority for other mutations and read permission for GET', () => {
  expect(resolveSdxPermission('POST', ['v1', 'deploy'])).toBe('application:deploy');
  expect(resolveSdxPermission('POST', ['v1', 'activation', 'compiler', 'compile', 'execute'])).toBe('application:deploy');
  expect(resolveSdxPermission('GET', ['v1', 'activation'])).toBe('application:view');
});
