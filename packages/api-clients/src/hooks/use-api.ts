'use client';

import { useMemo } from 'react';

import { useFeatureFlag } from '@bac/config';
import { useBacSession } from '@bac/auth';

import type { RequestContext } from '../http';
import type { AlertItem, ApprovalItem, BuildSummary, ClusterSummary, DashboardSummary, IncidentItem, PlatformOverview, SoftwareFactoryOverview, WorkItemSummary, WorkspaceSummary } from '@bac/domain-contracts';
import type { AuditEntry, ComplianceSummary } from '../mock/data';
import {
  alerts as mockAlerts,
  approvals as mockApprovals,
  auditLog as mockAuditLog,
  builds as mockBuilds,
  clusters as mockClusters,
  complianceSummary as mockComplianceSummary,
  dashboardSummary as mockDashboardSummary,
  incidents as mockIncidents,
  platformOverview as mockPlatformOverview,
  softwareFactoryOverview as mockSfOverview,
  workItems as mockWorkItems,
  workspacesPlatform as mockWorkspaces,
} from '../mock/data';
import { requestJson } from '../http';
import { loadWebConfig } from '@bac/config';

// ---------------------------------------------------------------------------
// API mode
// ---------------------------------------------------------------------------

export type ApiMode = 'mock' | 'live';

/**
 * Returns the current API mode based on the `mockApi` feature flag.
 */
export function useApiMode(): ApiMode {
  const isMock = useFeatureFlag('mockApi');
  return isMock ? 'mock' : 'live';
}

// ---------------------------------------------------------------------------
// Request context helper
// ---------------------------------------------------------------------------

function useRequestContext(): RequestContext {
  const session = useBacSession();
  return {
    accessToken: session?.accessToken,
    tenantId: session?.tenantId,
    workspaceId: session?.workspaceId,
  };
}

// ---------------------------------------------------------------------------
// URL resolvers
// ---------------------------------------------------------------------------

function resolveSdxUrl(path: string, ctx: RequestContext): string {
  const config = loadWebConfig();
  if (ctx.viaBff ?? config.proxyThroughBff) {
    return `/api/proxy/sdx/${path}`;
  }
  return `${config.sdxApiUrl}/${path}`;
}

function resolvePlatformUrl(path: string, ctx: RequestContext): string {
  const config = loadWebConfig();
  if (ctx.viaBff ?? config.proxyThroughBff) {
    return `/api/proxy/platform/${path}`;
  }
  return `${config.platformApiUrl}/${path}`;
}

// ---------------------------------------------------------------------------
// API client interface
// ---------------------------------------------------------------------------

export interface ApiClient {
  dashboard: {
    getSummary(role?: string): Promise<DashboardSummary>;
  };
  builds: {
    list(): Promise<BuildSummary[]>;
    get(id: string): Promise<BuildSummary>;
  };
  workItems: {
    list(): Promise<WorkItemSummary[]>;
    get(id: string): Promise<WorkItemSummary>;
  };
  alerts: {
    list(): Promise<AlertItem[]>;
    get(id: string): Promise<AlertItem>;
  };
  approvals: {
    list(): Promise<ApprovalItem[]>;
    get(id: string): Promise<ApprovalItem>;
    decide(id: string, decision: 'approved' | 'rejected'): Promise<void>;
  };
  incidents: {
    list(): Promise<IncidentItem[]>;
    get(id: string): Promise<IncidentItem>;
    acknowledge(id: string): Promise<void>;
  };
  clusters: {
    list(): Promise<ClusterSummary[]>;
    get(id: string): Promise<ClusterSummary>;
  };
  workspaces: {
    list(): Promise<WorkspaceSummary[]>;
    get(id: string): Promise<WorkspaceSummary>;
  };
  audit: {
    list(): Promise<AuditEntry[]>;
  };
  compliance: {
    getSummary(): Promise<ComplianceSummary>;
  };
  platform: {
    getSummary(): Promise<PlatformOverview>;
  };
  softwareFactory: {
    getSummary(): Promise<SoftwareFactoryOverview>;
  };
}

// ---------------------------------------------------------------------------
// Helpers for finding items in mock arrays
// ---------------------------------------------------------------------------

function findOrThrow<T extends { id: string }>(items: T[], id: string, label: string): T {
  const found = items.find((item) => item.id === id);
  if (!found) {
    throw new Error(`${label} with id "${id}" not found`);
  }
  return found;
}

// ---------------------------------------------------------------------------
// Mock client
// ---------------------------------------------------------------------------

function createMockClient(): ApiClient {
  return {
    dashboard: {
      async getSummary(_role?: string) {
        return mockDashboardSummary;
      },
    },
    builds: {
      async list() {
        return mockBuilds;
      },
      async get(id: string) {
        return findOrThrow(mockBuilds, id, 'Build');
      },
    },
    workItems: {
      async list() {
        return mockWorkItems;
      },
      async get(id: string) {
        return findOrThrow(mockWorkItems, id, 'WorkItem');
      },
    },
    alerts: {
      async list() {
        return mockAlerts;
      },
      async get(id: string) {
        return findOrThrow(mockAlerts, id, 'Alert');
      },
    },
    approvals: {
      async list() {
        return mockApprovals;
      },
      async get(id: string) {
        return findOrThrow(mockApprovals, id, 'Approval');
      },
      async decide(_id: string, _decision: 'approved' | 'rejected') {
        // no-op in mock mode
      },
    },
    incidents: {
      async list() {
        return mockIncidents;
      },
      async get(id: string) {
        return findOrThrow(mockIncidents, id, 'Incident');
      },
      async acknowledge(_id: string) {
        // no-op in mock mode
      },
    },
    clusters: {
      async list() {
        return mockClusters;
      },
      async get(id: string) {
        return findOrThrow(mockClusters, id, 'Cluster');
      },
    },
    workspaces: {
      async list() {
        return mockWorkspaces;
      },
      async get(id: string) {
        return findOrThrow(mockWorkspaces, id, 'Workspace');
      },
    },
    audit: {
      async list() {
        return mockAuditLog;
      },
    },
    compliance: {
      async getSummary() {
        return mockComplianceSummary;
      },
    },
    platform: {
      async getSummary() {
        return mockPlatformOverview;
      },
    },
    softwareFactory: {
      async getSummary() {
        return mockSfOverview;
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Live client
// ---------------------------------------------------------------------------

function createLiveClient(ctx: RequestContext): ApiClient {
  return {
    dashboard: {
      async getSummary(role?: string) {
        const query = role ? `?role=${encodeURIComponent(role)}` : '';
        return requestJson<DashboardSummary>(resolveSdxUrl(`api/dashboard/summary${query}`, ctx), {}, ctx);
      },
    },
    builds: {
      async list() {
        return requestJson<BuildSummary[]>(resolveSdxUrl('api/builds', ctx), {}, ctx);
      },
      async get(id: string) {
        return requestJson<BuildSummary>(resolveSdxUrl(`api/builds/${id}`, ctx), {}, ctx);
      },
    },
    workItems: {
      async list() {
        return requestJson<WorkItemSummary[]>(resolveSdxUrl('api/work-items', ctx), {}, ctx);
      },
      async get(id: string) {
        return requestJson<WorkItemSummary>(resolveSdxUrl(`api/work-items/${id}`, ctx), {}, ctx);
      },
    },
    alerts: {
      async list() {
        return requestJson<AlertItem[]>(resolvePlatformUrl('api/alerts', ctx), {}, ctx);
      },
      async get(id: string) {
        return requestJson<AlertItem>(resolvePlatformUrl(`api/alerts/${id}`, ctx), {}, ctx);
      },
    },
    approvals: {
      async list() {
        return requestJson<ApprovalItem[]>(resolveSdxUrl('api/approvals', ctx), {}, ctx);
      },
      async get(id: string) {
        return requestJson<ApprovalItem>(resolveSdxUrl(`api/approvals/${id}`, ctx), {}, ctx);
      },
      async decide(id: string, decision: 'approved' | 'rejected') {
        await requestJson<void>(
          resolveSdxUrl(`api/approvals/${id}/decide`, ctx),
          { method: 'POST', body: JSON.stringify({ decision }), headers: { 'content-type': 'application/json' } },
          ctx,
        );
      },
    },
    incidents: {
      async list() {
        return requestJson<IncidentItem[]>(resolvePlatformUrl('v1/incidents', ctx), {}, ctx);
      },
      async get(id: string) {
        return requestJson<IncidentItem>(resolvePlatformUrl(`v1/incidents/${id}`, ctx), {}, ctx);
      },
      async acknowledge(id: string) {
        await requestJson<void>(
          resolvePlatformUrl(`v1/incidents/${id}/acknowledge`, ctx),
          { method: 'POST' },
          ctx,
        );
      },
    },
    clusters: {
      async list() {
        return requestJson<ClusterSummary[]>(resolvePlatformUrl('v1/clusters', ctx), {}, ctx);
      },
      async get(id: string) {
        return requestJson<ClusterSummary>(resolvePlatformUrl(`v1/clusters/${id}`, ctx), {}, ctx);
      },
    },
    workspaces: {
      async list() {
        return requestJson<WorkspaceSummary[]>(resolvePlatformUrl('v1/workspaces', ctx), {}, ctx);
      },
      async get(id: string) {
        return requestJson<WorkspaceSummary>(resolvePlatformUrl(`v1/workspaces/${id}`, ctx), {}, ctx);
      },
    },
    audit: {
      async list() {
        return requestJson<AuditEntry[]>(resolvePlatformUrl('api/audit', ctx), {}, ctx);
      },
    },
    compliance: {
      async getSummary() {
        return requestJson<ComplianceSummary>(resolvePlatformUrl('v1/policy/summary', ctx), {}, ctx);
      },
    },
    platform: {
      async getSummary() {
        return requestJson<PlatformOverview>(resolvePlatformUrl('api/overview', ctx), {}, ctx);
      },
    },
    softwareFactory: {
      async getSummary() {
        return requestJson<SoftwareFactoryOverview>(resolveSdxUrl('api/dashboard/overview', ctx), {}, ctx);
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Central API hook that switches between mock and live data.
 * When mockApi flag is true  -> returns mock data
 * When mockApi flag is false -> calls live API client
 */
export function useApiClient(): ApiClient {
  const mode = useApiMode();
  const ctx = useRequestContext();

  return useMemo(() => {
    if (mode === 'mock') {
      return createMockClient();
    }
    return createLiveClient(ctx);
  }, [mode, ctx]);
}
