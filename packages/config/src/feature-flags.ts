'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export interface FlagEvaluationContext {
  userId?: string;
  tenantId?: string;
  workspaceId?: string;
  roles?: string[];
  [key: string]: unknown;
}

export interface FeatureFlagConfig {
  /** Static flags loaded from env or build-time config. */
  staticFlags: Record<string, boolean>;
  /** URL to fetch remote flag overrides from. Defaults to '/api/flags'. */
  remoteUrl?: string;
  /** How often (in ms) to poll for remote flag changes. Default: 60000 (1 min). */
  refreshIntervalMs?: number;
  /** User context for contextual flag evaluation. */
  evaluationContext?: FlagEvaluationContext;
}

interface FeatureFlagContextValue {
  /** Evaluate a flag by name. Returns boolean. */
  isEnabled: (flagName: string) => boolean;
  /** Whether remote flags have been loaded at least once. */
  remoteLoaded: boolean;
  /** Force a refresh of remote flags. */
  refresh: () => Promise<void>;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue | null>(null);

/**
 * Evaluate a flag against static flags and optional remote overrides.
 * Remote flags take precedence when available.
 */
export function evaluateFlag(
  flagName: string,
  staticFlags: Record<string, boolean>,
  remoteFlags: Record<string, boolean>,
  _context?: FlagEvaluationContext,
): boolean {
  // Remote flags override static flags.
  if (flagName in remoteFlags) {
    return remoteFlags[flagName]!;
  }

  if (flagName in staticFlags) {
    return staticFlags[flagName]!;
  }

  // Unknown flags default to off.
  return false;
}

async function fetchRemoteFlags(
  url: string,
  context?: FlagEvaluationContext,
): Promise<Record<string, boolean>> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ context: context ?? {} }),
    });

    if (!response.ok) {
      return {};
    }

    const data: unknown = await response.json();

    if (data && typeof data === 'object' && 'flags' in data) {
      return (data as { flags: Record<string, boolean> }).flags;
    }

    return {};
  } catch {
    // Silently fall back to static flags when remote is unavailable.
    return {};
  }
}

export function FeatureFlagProvider({
  children,
  config,
}: {
  children: ReactNode;
  config: FeatureFlagConfig;
}) {
  const {
    staticFlags,
    remoteUrl = '/api/flags',
    refreshIntervalMs = 60_000,
    evaluationContext,
  } = config;

  const [remoteFlags, setRemoteFlags] = useState<Record<string, boolean>>({});
  const [remoteLoaded, setRemoteLoaded] = useState(false);

  const loadRemoteFlags = useCallback(async () => {
    const flags = await fetchRemoteFlags(remoteUrl, evaluationContext);
    setRemoteFlags(flags);
    setRemoteLoaded(true);
  }, [remoteUrl, evaluationContext]);

  useEffect(() => {
    loadRemoteFlags();

    if (refreshIntervalMs > 0) {
      const interval = setInterval(loadRemoteFlags, refreshIntervalMs);
      return () => clearInterval(interval);
    }

    return undefined;
  }, [loadRemoteFlags, refreshIntervalMs]);

  const isEnabled = useCallback(
    (flagName: string) =>
      evaluateFlag(flagName, staticFlags, remoteFlags, evaluationContext),
    [staticFlags, remoteFlags, evaluationContext],
  );

  const value = useMemo<FeatureFlagContextValue>(
    () => ({ isEnabled, remoteLoaded, refresh: loadRemoteFlags }),
    [isEnabled, remoteLoaded, loadRemoteFlags],
  );

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

/**
 * Hook to evaluate a specific feature flag. Returns true if the flag is enabled.
 */
export function useFeatureFlag(flagName: string): boolean {
  const context = useContext(FeatureFlagContext);

  if (!context) {
    throw new Error('useFeatureFlag must be used within a FeatureFlagProvider');
  }

  return context.isEnabled(flagName);
}

/**
 * Hook to access the full feature flag context (isEnabled, remoteLoaded, refresh).
 */
export function useFeatureFlags(): FeatureFlagContextValue {
  const context = useContext(FeatureFlagContext);

  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }

  return context;
}
