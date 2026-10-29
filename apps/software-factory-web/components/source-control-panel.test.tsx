import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import { SourceControlPanel } from './source-control-panel';

afterEach(() => vi.unstubAllGlobals());

it('shows a truthful empty state when no local repository manifest is configured', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'NOT_CONFIGURED' }), { status: 503 })));
  render(<SourceControlPanel />);
  await waitFor(() => expect(screen.getByText(/No local repository connections are configured/i)).toBeTruthy());
  expect(screen.queryByRole('button', { name: /Resolve immutable scope/ })).toBeNull();
});

it('resolves a selected repository to the immutable SHA returned by the API', async () => {
  const fetcher = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ connections: [{ id: 'conn-1', repository: 'org/service', default_branch: 'main' }] }), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ selection: { connection_id: 'conn-1', scope: { kind: 'repository' } }, commit_sha: '0123456789abcdef0123456789abcdef01234567', rationale: 'Resolved to the configured default branch.' }), { status: 200 }));
  vi.stubGlobal('fetch', fetcher);
  render(<SourceControlPanel />);
  fireEvent.click(await screen.findByRole('button', { name: /Resolve immutable scope/ }));
  await waitFor(() => expect(screen.getByText('0123456789abcdef0123456789abcdef01234567')).toBeTruthy());
  expect(fetcher).toHaveBeenLastCalledWith('/api/proxy/sdx/v1/source-control/resolve', expect.objectContaining({ method: 'POST' }));
});
