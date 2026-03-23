'use client';
import React from 'react';
import { GovernanceGate } from './governance-gate';
import { useGovernanceMode } from '../hooks/use-governance-mode';

interface GovernedApprovalButtonProps {
  approvalId: string;
  approvalTitle: string;
  decision: 'approve' | 'reject';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  onExecute: () => void | Promise<void>;
}

export function GovernedApprovalButton({ approvalId, approvalTitle, decision, riskLevel, onExecute }: GovernedApprovalButtonProps) {
  const mode = useGovernanceMode();
  const actionDesc = decision === 'approve'
    ? `You are about to approve "${approvalTitle}" (ID: ${approvalId}). This action will be recorded in the audit trail.`
    : `You are about to reject "${approvalTitle}" (ID: ${approvalId}). This action cannot be undone.`;

  return (
    <GovernanceGate mode={mode} actionDescription={actionDesc} riskLevel={riskLevel} onConfirm={onExecute}>
      {({ execute, isPending }) => (
        <button
          onClick={execute}
          disabled={isPending}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            decision === 'approve'
              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
          } disabled:opacity-50`}
        >
          {isPending ? 'Processing...' : decision === 'approve' ? 'Approve' : 'Reject'}
        </button>
      )}
    </GovernanceGate>
  );
}

interface GovernedIncidentActionProps {
  incidentId: string;
  incidentTitle: string;
  action: 'acknowledge' | 'escalate' | 'resolve';
  severity: 'low' | 'medium' | 'high' | 'critical';
  onExecute: () => void | Promise<void>;
}

export function GovernedIncidentAction({ incidentId, incidentTitle, action, severity, onExecute }: GovernedIncidentActionProps) {
  const mode = useGovernanceMode();
  const actionVerb = action === 'acknowledge' ? 'acknowledge' : action === 'escalate' ? 'escalate' : 'resolve';
  const actionDesc = `You are about to ${actionVerb} incident "${incidentTitle}" (ID: ${incidentId}, severity: ${severity}). This will update the incident status and notify affected parties.`;

  return (
    <GovernanceGate mode={mode} actionDescription={actionDesc} riskLevel={severity} onConfirm={onExecute}>
      {({ execute, isPending }) => (
        <button
          onClick={execute}
          disabled={isPending}
          className="rounded-lg bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/30 disabled:opacity-50"
        >
          {isPending ? 'Processing...' : actionVerb.charAt(0).toUpperCase() + actionVerb.slice(1)}
        </button>
      )}
    </GovernanceGate>
  );
}

interface GovernedAlertActionProps {
  alertId: string;
  alertTitle: string;
  onExecute: () => void | Promise<void>;
}

export function GovernedAlertAction({ alertId, alertTitle, onExecute }: GovernedAlertActionProps) {
  const mode = useGovernanceMode();
  return (
    <GovernanceGate
      mode={mode}
      actionDescription={`Acknowledge alert "${alertTitle}" (ID: ${alertId}). This will mark the alert as acknowledged.`}
      riskLevel="medium"
      onConfirm={onExecute}
    >
      {({ execute, isPending }) => (
        <button
          onClick={execute}
          disabled={isPending}
          className="rounded-lg bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-400 hover:bg-blue-500/30 disabled:opacity-50"
        >
          {isPending ? 'Processing...' : 'Acknowledge'}
        </button>
      )}
    </GovernanceGate>
  );
}

interface GovernedWorkspaceActionProps {
  workspaceId: string;
  workspaceName: string;
  action: string;
  onExecute: () => void | Promise<void>;
}

export function GovernedWorkspaceAction({ workspaceId, workspaceName, action, onExecute }: GovernedWorkspaceActionProps) {
  const mode = useGovernanceMode();
  return (
    <GovernanceGate
      mode={mode}
      actionDescription={`Execute "${action}" on workspace "${workspaceName}" (ID: ${workspaceId}).`}
      riskLevel="high"
      onConfirm={onExecute}
    >
      {({ execute, isPending }) => (
        <button
          onClick={execute}
          disabled={isPending}
          className="rounded-lg bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-50"
        >
          {isPending ? 'Processing...' : action}
        </button>
      )}
    </GovernanceGate>
  );
}
