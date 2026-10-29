import { afterEach, expect, it } from 'vitest';
import { clearTenantOverrides, getTenantOverride, setTenantOverrides } from './tenant-overrides';

afterEach(() => clearTenantOverrides('test-tenant'));
it('supports overrides without expiry and removes expired overrides', () => {
  setTenantOverrides('test-tenant', { mockApi: false });
  expect(getTenantOverride('test-tenant', 'mockApi')).toBe(false);
  setTenantOverrides('test-tenant', { mockApi: true }, '2000-01-01T00:00:00Z');
  expect(getTenantOverride('test-tenant', 'mockApi')).toBeUndefined();
});
