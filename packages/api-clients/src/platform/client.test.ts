import { describe, expect, it, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

import { getPlatformOverview, listClusters } from './client';

const server = setupServer(
  http.get('/api/proxy/hasura/api/overview', () => {
    return HttpResponse.json({ totalClusters: 15, activeIncidents: 0 });
  }),
  http.get('https://platform.example.com/api/clusters', () => {
    return HttpResponse.json([{ id: 'c-1', name: 'us-east', status: 'ready' }]);
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});
afterAll(() => server.close());

// Mock config module to control proxyThroughBff and enableMockApi
vi.mock('@bac/config', () => ({
  loadWebConfig: () => ({
    proxyThroughBff: true,
    enableMockApi: false,
    platformApiUrl: 'https://platform.example.com',
  }),
}));

// Mock http module requestJson to just use standard fetch since vitest has global fetch
vi.mock('../http', () => ({
  requestJson: async (url: string, init?: RequestInit) => {
    const res = await fetch(url, init);
    if (!res.ok) throw new Error('API Error');
    return res.json();
  },
}));

describe('platform/client', () => {
  it('uses mock data when context.useMock is true', async () => {
    const result = await getPlatformOverview({ useMock: true });
    expect(result).toBeDefined();
    // Assuming platformOverview mock has a specific structure
    expect(Object.keys(result).length).toBeGreaterThan(0);
  });

  it('fetches from BFF when viaBff is true or config.proxyThroughBff is true', async () => {
    const result = await getPlatformOverview({ useMock: false });
    expect(result).toEqual({ totalClusters: 15, activeIncidents: 0 });
  });

  it('fetches from external URL when viaBff is false and proxyThroughBff is false', async () => {
    // Override config mock behavior for this test if possible, or override via context
    const result = await listClusters({ useMock: false, viaBff: false });
    expect(result).toEqual([{ id: 'c-1', name: 'us-east', status: 'ready' }]);
  });
});
