import { beforeEach, expect, it, vi } from 'vitest';

import { POST } from './route';

const env = vi.hoisted(() => ({ environment: 'development', sessionSecret: 'test-session-secret-0123456789' }));
vi.mock('@/lib/env', () => ({ loadAppEnv: () => env }));

function form(values: Record<string, string>) {
  const body = new FormData();
  Object.entries(values).forEach(([key, value]) => body.set(key, value));
  return new Request('http://localhost/api/auth/mock-login', { method: 'POST', body });
}

beforeEach(() => {
  env.environment = 'development';
});

it('is unavailable outside development and sets no session', async () => {
  for (const environment of ['production', 'staging', 'test']) {
    env.environment = environment;
    const response = await POST(form({ tenantId: 'tenant-a' }));
    expect(response.status).toBe(404);
    expect(response.headers.get('set-cookie')).toBeNull();
  }
});

it('issues a signed local session in development and refuses off-site redirects', async () => {
  const response = await POST(form({ next: '//evil.example/path', tenantId: 'tenant-a', workspaceId: 'ws-a' }));
  expect(response.status).toBe(303);
  expect(response.headers.get('location')).toBe('/software-factory');
  expect(response.headers.get('set-cookie')).toContain('bac_session=');
});

it('redirects relative to the browser origin, not the server-observed host, without replaying the POST', async () => {
  const body = new FormData();
  body.set('next', '/software-factory/prd-intake');
  // Route handlers can observe a bind/internal host that differs from the
  // origin the browser used and stored the cookie for.
  const response = await POST(new Request('http://0.0.0.0:3000/api/auth/mock-login', { method: 'POST', body }));
  expect(response.status).toBe(303);
  expect(response.headers.get('location')).toBe('/software-factory/prd-intake');
});
