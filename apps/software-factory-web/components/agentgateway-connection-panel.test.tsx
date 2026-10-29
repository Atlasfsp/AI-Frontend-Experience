import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import { AgentGatewayConnectionPanel } from './agentgateway-connection-panel';

afterEach(() => vi.unstubAllGlobals());

it('explains how an administrator can connect an agentgateway without entering provider keys', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          configured: false,
          reachable: false,
          models: [],
          checked_at: '2026-10-29T10:00:00Z',
          reason: 'gateway_not_configured',
        }),
        { status: 200 },
      ),
    ),
  );

  render(<AgentGatewayConnectionPanel />);

  await waitFor(() => expect(screen.getByText('Not configured')).toBeTruthy());
  expect(screen.getByText(/AGENTGATEWAY_BASE_URL/)).toBeTruthy();
  expect(screen.getByText(/never paste provider keys into FluxCore/i)).toBeTruthy();
  expect(screen.getByRole('link', { name: /Gateway setup guide/ }).getAttribute('href')).toContain('agentgateway.dev');
});

it('shows models returned by the protected backend status probe', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          configured: true,
          reachable: true,
          endpoint: 'http://127.0.0.1:3000',
          models: ['openai/gpt-test'],
          checked_at: '2026-10-29T10:00:00Z',
          reason: 'connected',
        }),
        { status: 200 },
      ),
    ),
  );

  render(<AgentGatewayConnectionPanel />);

  await waitFor(() => expect(screen.getByText('Connected')).toBeTruthy());
  expect(screen.getByText('openai/gpt-test')).toBeTruthy();
});
