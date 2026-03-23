'use client';

import React, { useCallback, useState } from 'react';
import type { GovernanceMode } from '../hooks/use-governance-mode';

export interface GovernanceGateRenderProps {
  execute: () => void;
  isPending: boolean;
}

export interface GovernanceGateProps {
  mode: GovernanceMode;
  actionDescription: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  onConfirm: () => void | Promise<void>;
  children: (props: GovernanceGateRenderProps) => React.ReactNode;
}

/**
 * GovernanceGate wraps a destructive or consequential action with
 * a confirmation step that respects the current governance mode.
 *
 * - FULL_AUTONOMY: executes immediately.
 * - HOTL: auto-executes only low-risk actions; higher-risk actions require confirmation.
 * - HITL: always shows a confirmation dialog before executing.
 */
export function GovernanceGate({
  mode,
  actionDescription,
  riskLevel,
  onConfirm,
  children,
}: GovernanceGateProps) {
  const [isPending, setIsPending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const executeAction = useCallback(async () => {
    setIsPending(true);
    try {
      await onConfirm();
    } finally {
      setIsPending(false);
      setShowConfirm(false);
    }
  }, [onConfirm]);

  const handleExecute = useCallback(() => {
    if (mode === 'FULL_AUTONOMY' || (mode === 'HOTL' && riskLevel === 'low')) {
      void executeAction();
    } else {
      setShowConfirm(true);
    }
  }, [mode, riskLevel, executeAction]);

  const handleCancel = useCallback(() => {
    setShowConfirm(false);
  }, []);

  return (
    <>
      {children({ execute: handleExecute, isPending })}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl border border-white/10 bg-gray-900 p-6 shadow-2xl">
            <h3 className="mb-2 text-lg font-semibold text-white">Confirm Action</h3>
            <p className="mb-1 text-sm text-gray-400">{actionDescription}</p>
            <p className="mb-4 text-xs text-gray-500">
              Risk level:{' '}
              <span
                className={
                  riskLevel === 'critical'
                    ? 'text-red-400'
                    : riskLevel === 'high'
                      ? 'text-orange-400'
                      : riskLevel === 'medium'
                        ? 'text-amber-400'
                        : 'text-green-400'
                }
              >
                {riskLevel.toUpperCase()}
              </span>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancel}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => void executeAction()}
                disabled={isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {isPending ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
