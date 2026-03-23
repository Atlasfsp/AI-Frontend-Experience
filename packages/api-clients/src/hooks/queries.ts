'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useApiClient } from './use-api';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const queryKeys = {
  dashboard: (role?: string) => ['dashboard', role ?? 'default'] as const,
  builds: () => ['builds'] as const,
  build: (id: string) => ['builds', id] as const,
  workItems: () => ['work-items'] as const,
  workItem: (id: string) => ['work-items', id] as const,
  alerts: () => ['alerts'] as const,
  alert: (id: string) => ['alerts', id] as const,
  approvals: () => ['approvals'] as const,
  approval: (id: string) => ['approvals', id] as const,
  incidents: () => ['incidents'] as const,
  incident: (id: string) => ['incidents', id] as const,
  clusters: () => ['clusters'] as const,
  cluster: (id: string) => ['clusters', id] as const,
  workspaces: () => ['workspaces'] as const,
  workspace: (id: string) => ['workspaces', id] as const,
  audit: () => ['audit'] as const,
  compliance: () => ['compliance'] as const,
  platform: () => ['platform-summary'] as const,
  softwareFactory: () => ['software-factory-summary'] as const,
} as const;

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export function useDashboard(role?: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.dashboard(role),
    queryFn: () => api.dashboard.getSummary(role),
  });
}

// ---------------------------------------------------------------------------
// Builds
// ---------------------------------------------------------------------------

export function useBuildsQuery() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.builds(),
    queryFn: () => api.builds.list(),
  });
}

export function useBuildQuery(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.build(id),
    queryFn: () => api.builds.get(id),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Work Items
// ---------------------------------------------------------------------------

export function useWorkItemsQuery() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.workItems(),
    queryFn: () => api.workItems.list(),
  });
}

export function useWorkItemQuery(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.workItem(id),
    queryFn: () => api.workItems.get(id),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

export function useAlertsQuery() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.alerts(),
    queryFn: () => api.alerts.list(),
  });
}

export function useAlertQuery(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.alert(id),
    queryFn: () => api.alerts.get(id),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Approvals
// ---------------------------------------------------------------------------

export function useApprovalsQuery() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.approvals(),
    queryFn: () => api.approvals.list(),
  });
}

export function useApprovalQuery(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.approval(id),
    queryFn: () => api.approvals.get(id),
    enabled: !!id,
  });
}

export function useApprovalDecision() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'approved' | 'rejected' }) =>
      api.approvals.decide(id, decision),
    async onSuccess(_data, variables) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.approval(variables.id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.approvals() });
    },
  });
}

// ---------------------------------------------------------------------------
// Incidents
// ---------------------------------------------------------------------------

export function useIncidentsQuery() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.incidents(),
    queryFn: () => api.incidents.list(),
  });
}

export function useIncidentQuery(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.incident(id),
    queryFn: () => api.incidents.get(id),
    enabled: !!id,
  });
}

export function useIncidentAcknowledge() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.incidents.acknowledge(id),
    async onSuccess(_data, id) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.incident(id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.incidents() });
    },
  });
}

// ---------------------------------------------------------------------------
// Clusters
// ---------------------------------------------------------------------------

export function useClustersQuery() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.clusters(),
    queryFn: () => api.clusters.list(),
  });
}

export function useClusterQuery(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.cluster(id),
    queryFn: () => api.clusters.get(id),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Workspaces
// ---------------------------------------------------------------------------

export function useWorkspacesQuery() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.workspaces(),
    queryFn: () => api.workspaces.list(),
  });
}

export function useWorkspaceQuery(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.workspace(id),
    queryFn: () => api.workspaces.get(id),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

export function useAuditQuery() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.audit(),
    queryFn: () => api.audit.list(),
  });
}

// ---------------------------------------------------------------------------
// Compliance
// ---------------------------------------------------------------------------

export function useComplianceQuery() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.compliance(),
    queryFn: () => api.compliance.getSummary(),
  });
}

// ---------------------------------------------------------------------------
// Platform Summary
// ---------------------------------------------------------------------------

export function usePlatformSummaryQuery() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.platform(),
    queryFn: () => api.platform.getSummary(),
  });
}

// ---------------------------------------------------------------------------
// Software Factory Summary
// ---------------------------------------------------------------------------

export function useSoftwareFactorySummaryQuery() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.softwareFactory(),
    queryFn: () => api.softwareFactory.getSummary(),
  });
}
