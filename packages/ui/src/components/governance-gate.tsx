'use client';

import React, { useState, useCallback } from 'react';

export type GovernanceMode = 'HOTL' | 'HITL' | 'FULL_AUTONOMY';

export interface GovernanceGateProps {
  /** The governance mode to enforce */
  mode: GovernanceMode;
  /** Description of the action being gated */
  actionDescription: string;
  /** Risk level of the action */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  /** The actual action to execute after confirmation */
  onConfirm: () => void | Promise<void>;
  /** Optional second reviewer callback for HITL mode */
  onRequestSecondReview?: () => void | Promise<void>;
  /** Children render prop: receives { execute } function */
  children: (props: { execute: () => void; isPending: boolean }) => React.ReactNode;
}

/**
 * GovernanceGate wraps destructive/approval actions with mode-aware confirmation.
 *
 * HOTL: Shows confirmation dialog with action summary before executing.
 * HITL: Shows confirmation + requires second reviewer approval.
 * FULL_AUTONOMY: Executes immediately without confirmation.
 */
export function GovernanceGate({ mode, actionDescription, riskLevel, onConfirm, onRequestSecondReview, children }: GovernanceGateProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [secondReviewRequested, setSecondReviewRequested] = useState(false);

  const execute = useCallback(() => {
    if (mode === 'FULL_AUTONOMY') {
      setIsPending(true);
      Promise.resolve(onConfirm()).finally(() => setIsPending(false));
      return;
    }
    setShowDialog(true);
  }, [mode, onConfirm]);

  const handleConfirm = useCallback(async () => {
    if (mode === 'HITL' && !secondReviewRequested && onRequestSecondReview) {
      setSecondReviewRequested(true);
      await onRequestSecondReview();
      return;
    }
    setIsPending(true);
    setShowDialog(false);
    try {
      await onConfirm();
    } finally {
      setIsPending(false);
      setSecondReviewRequested(false);
    }
  }, [mode, onConfirm, onRequestSecondReview, secondReviewRequested]);

  const handleCancel = useCallback(() => {
    setShowDialog(false);
    setSecondReviewRequested(false);
  }, []);

  const riskColors = {
    low: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    medium: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    high: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
    critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  };

  const colors = riskColors[riskLevel];

  return (
    <>
      {children({ execute, isPending })}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl border border-white/10 bg-[#0d1f3c] p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className={`rounded-lg ${colors.bg} p-2`}>
                <svg className={`h-5 w-5 ${colors.text}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {mode === 'HITL' ? 'Review Required' : 'Confirm Action'}
                </h3>
                <span className={`text-xs font-medium uppercase tracking-wider ${colors.text}`}>
                  {riskLevel} risk · {mode} mode
                </span>
              </div>
            </div>

            <p className="mb-6 text-sm leading-relaxed text-slate-300">
              {actionDescription}
            </p>

            {mode === 'HITL' && !secondReviewRequested && (
              <p className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">
                HITL mode requires a second reviewer to approve this action.
              </p>
            )}

            {mode === 'HITL' && secondReviewRequested && (
              <p className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                Second review requested. Waiting for approval...
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancel}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className={`rounded-lg ${colors.bg} ${colors.border} border px-4 py-2 text-sm font-medium ${colors.text} hover:brightness-110 disabled:opacity-50`}
              >
                {isPending ? 'Processing...' : mode === 'HITL' && !secondReviewRequested ? 'Request Review' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
