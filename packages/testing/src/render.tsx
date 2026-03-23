'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@bac/auth';
import type { BacSession } from '@bac/auth';
import { render } from '@testing-library/react';

import { sessionFixture } from './fixtures';

export function renderWithProviders(
  ui: React.ReactElement,
  session: BacSession | null = sessionFixture,
): ReturnType<typeof render> {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider session={session}>{ui}</AuthProvider>
    </QueryClientProvider>,
  );
}
