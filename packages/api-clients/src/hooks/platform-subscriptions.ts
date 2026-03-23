'use client';

import { useSubscription } from './use-subscription';

/* ------------------------------------------------------------------ */
/*  Subscription type contracts                                        */
/* ------------------------------------------------------------------ */

export interface IncidentChange {
  id: string;
  title: string;
  severity: 'critical' | 'warning';
  status: 'investigating' | 'mitigated' | 'monitoring' | 'resolved';
  updatedAt: string;
  owner: string;
  service: string;
}

export interface ClusterHealth {
  id: string;
  name: string;
  region: string;
  status: 'healthy' | 'warning' | 'critical';
  nodeCount: number;
  cpuUtilization: number;
  memoryUtilization: number;
  updatedAt: string;
}

export interface BuildProgress {
  id: string;
  name: string;
  stage: string;
  status: 'queued' | 'running' | 'successful' | 'failed';
  progress: number;
  startedAt: string;
  updatedAt: string;
  logTail?: string;
}

export interface AlertStreamItem {
  id: string;
  title: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  source: string;
  firedAt: string;
  acknowledged: boolean;
}

/* ------------------------------------------------------------------ */
/*  GraphQL subscription queries                                       */
/* ------------------------------------------------------------------ */

const INCIDENT_SUBSCRIPTION = /* GraphQL */ `
  subscription IncidentChanges($workspaceId: String!) {
    incidents_stream(
      batch_size: 10
      cursor: { initial_value: { updated_at: "now()" } }
      where: { workspace_id: { _eq: $workspaceId } }
    ) {
      id
      title
      severity
      status
      updated_at
      owner
      service
    }
  }
`;

const CLUSTER_HEALTH_SUBSCRIPTION = /* GraphQL */ `
  subscription ClusterHealth {
    cluster_health_stream(
      batch_size: 10
      cursor: { initial_value: { updated_at: "now()" } }
    ) {
      id
      name
      region
      status
      node_count
      cpu_utilization
      memory_utilization
      updated_at
    }
  }
`;

const BUILD_PROGRESS_SUBSCRIPTION = /* GraphQL */ `
  subscription BuildProgress($workspaceId: String!) {
    builds_stream(
      batch_size: 10
      cursor: { initial_value: { updated_at: "now()" } }
      where: { workspace_id: { _eq: $workspaceId } }
    ) {
      id
      name
      stage
      status
      progress
      started_at
      updated_at
      log_tail
    }
  }
`;

const ALERT_STREAM_SUBSCRIPTION = /* GraphQL */ `
  subscription AlertStream($workspaceId: String!) {
    alerts_stream(
      batch_size: 10
      cursor: { initial_value: { fired_at: "now()" } }
      where: { workspace_id: { _eq: $workspaceId } }
    ) {
      id
      title
      severity
      category
      source
      fired_at
      acknowledged
    }
  }
`;

/* ------------------------------------------------------------------ */
/*  Pre-built subscription hooks                                       */
/* ------------------------------------------------------------------ */

/**
 * Subscribe to incident changes within a workspace.
 * Receives real-time updates when incidents are created, updated, or resolved.
 */
export function useIncidentSubscription(workspaceId?: string) {
  return useSubscription<{ incidents_stream: IncidentChange[] }>(
    INCIDENT_SUBSCRIPTION,
    workspaceId ? { workspaceId } : undefined,
  );
}

/**
 * Subscribe to cluster health status changes.
 * Receives real-time updates for node counts, CPU/memory utilization, and status.
 */
export function useClusterHealthSubscription() {
  return useSubscription<{ cluster_health_stream: ClusterHealth[] }>(
    CLUSTER_HEALTH_SUBSCRIPTION,
  );
}

/**
 * Subscribe to build progress updates within a workspace.
 * Receives real-time stage transitions, progress percentages, and log tail lines.
 */
export function useBuildProgressSubscription(workspaceId?: string) {
  return useSubscription<{ builds_stream: BuildProgress[] }>(
    BUILD_PROGRESS_SUBSCRIPTION,
    workspaceId ? { workspaceId } : undefined,
  );
}

/**
 * Subscribe to new alerts firing within a workspace.
 * Receives real-time alerts as they are created in the alerting pipeline.
 */
export function useAlertStreamSubscription(workspaceId?: string) {
  return useSubscription<{ alerts_stream: AlertStreamItem[] }>(
    ALERT_STREAM_SUBSCRIPTION,
    workspaceId ? { workspaceId } : undefined,
  );
}
