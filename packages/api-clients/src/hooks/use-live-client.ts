'use client';

import { useMemo } from 'react';

import { useBacSession } from '@bac/auth';
import { loadWebConfig } from '@bac/config';

import { SoftwareFactoryApiClient } from '../generated/software-factory-client';
import { PlatformAutomationApiClient } from '../generated/platform-automation-client';

/**
 * React hook that returns memoized, pre-configured typed API clients for the
 * Software Factory (SDX) and Platform Automation services.
 *
 * The clients are wired to the current user's access token via `@bac/auth` and
 * resolve base URLs from `@bac/config`.
 *
 * Usage:
 * ```tsx
 * const { sdx, platform } = useLiveClient();
 * const workflows = await sdx.listWorkflows();
 * const clusters = await platform.listClusters();
 * ```
 */
export function useLiveClient() {
  const session = useBacSession();
  const config = loadWebConfig();

  const sdx = useMemo(
    () =>
      new SoftwareFactoryApiClient({
        baseUrl: config.sdxApiUrl,
        getToken: async () => session?.accessToken ?? '',
      }),
    [config.sdxApiUrl, session?.accessToken],
  );

  const platform = useMemo(
    () =>
      new PlatformAutomationApiClient({
        baseUrl: config.platformApiUrl,
        getToken: async () => session?.accessToken ?? '',
      }),
    [config.platformApiUrl, session?.accessToken],
  );

  return { sdx, platform };
}
