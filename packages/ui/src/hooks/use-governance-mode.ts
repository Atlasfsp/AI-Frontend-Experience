'use client';
import { useMemo } from 'react';
import type { GovernanceMode } from '../components/governance-gate';

/**
 * Returns the current governance mode from environment.
 * Defaults to HOTL if not configured.
 */
export function useGovernanceMode(): GovernanceMode {
  return useMemo(() => {
    const mode = typeof window !== 'undefined'
      ? (process.env.NEXT_PUBLIC_BAC_GOVERNANCE_MODE as GovernanceMode)
      : undefined;
    if (mode === 'HITL' || mode === 'FULL_AUTONOMY') return mode;
    return 'HOTL';
  }, []);
}

export type { GovernanceMode };
