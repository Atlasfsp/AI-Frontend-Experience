export interface BuildSummary {
  id: string;
  name: string;
  stage: string;
  status: 'danger' | 'neutral' | 'success' | 'warning';
  updatedAt: string;
}

export interface WorkItemSummary {
  id: string;
  owner: string;
  priority: string;
  status: string;
  title: string;
  updatedAt: string;
}

export interface SoftwareFactoryOverview {
  activeBuilds: number;
  gatePassRate: string;
  openReviews: number;
  recentBuild: BuildSummary;
}

export interface AgentSummary {
  id: string;
  model: string;
  service: string;
  status: 'healthy' | 'idle' | 'working';
}

export interface ClusterSummary {
  id: string;
  region: string;
  status: 'healthy' | 'warning';
  workloadCount: number;
}

export interface WorkspaceSummary {
  id: string;
  promiseCount: number;
  status: 'healthy' | 'warning';
  tenant: string;
}

export interface PromiseSummary {
  id: string;
  owner: string;
  status: 'available' | 'preview';
  title: string;
}

export interface PlatformOverview {
  activeAlerts: number;
  clusterHealth: string;
  fleetSync: string;
  managedWorkspaces: number;
}

export interface SwaggerDocument {
  info: {
    title: string;
    version: string;
  };
  openapi: string;
  paths: Record<string, unknown>;
}
