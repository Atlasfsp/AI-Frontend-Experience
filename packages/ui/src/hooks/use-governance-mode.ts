'use client';

import { useSyncExternalStore } from 'react';

/**
 * Governance mode determines how AI-driven or destructive actions are gated.
 *
 * - HOTL  (Human-On-The-Loop): AI acts, human is notified and can override.
 * - HITL  (Human-In-The-Loop): AI proposes, human must confirm before execution.
 * - FULL_AUTONOMY: AI acts without human confirmation inside approved guardrails.
 */
export type GovernanceMode = 'HOTL' | 'HITL' | 'FULL_AUTONOMY';

const STORAGE_KEY = 'bac-governance-mode';
const DEFAULT_MODE: GovernanceMode = 'HOTL';

let listeners: Array<() => void> = [];

function getSnapshot(): GovernanceMode {
  if (typeof window === 'undefined') return DEFAULT_MODE;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'HOTL' || stored === 'HITL' || stored === 'FULL_AUTONOMY') return stored;
  return DEFAULT_MODE;
}

function getServerSnapshot(): GovernanceMode {
  return DEFAULT_MODE;
}

function subscribe(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function setGovernanceMode(mode: GovernanceMode): void {
  localStorage.setItem(STORAGE_KEY, mode);
  listeners.forEach((l) => l());
}

export function useGovernanceMode(): GovernanceMode {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
