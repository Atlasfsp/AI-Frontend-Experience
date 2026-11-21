import { NextRequest } from 'next/server';
import { expect, it } from 'vitest';

import * as route from './route';

function signOut(headers: Record<string, string> = {}) {
  return new NextRequest('http://0.0.0.0:3000/logout', {
    method: 'POST',
    headers: { cookie: 'bac_session=signed', ...headers },
  });
}

it('does not expose a GET handler that router prefetches could trigger', () => {
  expect('GET' in route).toBe(false);
});

it('clears the session and redirects relative to the browser origin', async () => {
  const response = await route.POST(signOut({ 'sec-fetch-site': 'same-origin' }));
  expect(response.status).toBe(303);
  expect(response.headers.get('location')).toBe('/login');
  expect(response.headers.get('set-cookie')).toMatch(/bac_session=;.*Expires=Thu, 01 Jan 1970/);
});

it('refuses cross-site sign-out without touching cookies', async () => {
  const response = await route.POST(signOut({ 'sec-fetch-site': 'cross-site' }));
  expect(response.status).toBe(403);
  expect(response.headers.get('set-cookie')).toBeNull();
});
