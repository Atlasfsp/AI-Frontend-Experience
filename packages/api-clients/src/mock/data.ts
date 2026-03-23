import type {
  AgentSummary,
  BuildSummary,
  ClusterSummary,
  PlatformOverview,
  PromiseSummary,
  SoftwareFactoryOverview,
  WorkItemSummary,
  WorkspaceSummary,
} from '../types';

export const builds: BuildSummary[] = [
  {
    id: 'build-1042',
    name: 'Merchant settlement hardening',
    stage: 'quality-gates',
    status: 'warning',
    updatedAt: '2026-03-22T09:05:00.000Z',
  },
  {
    id: 'build-1043',
    name: 'Platform bootstrap telemetry',
    stage: 'artifact-publish',
    status: 'success',
    updatedAt: '2026-03-22T08:30:00.000Z',
  },
];

export const workItems: WorkItemSummary[] = [
  {
    id: 'wi-204',
    owner: 'BAC Platform',
    priority: 'High',
    status: 'In progress',
    title: 'Instrument deployment review workflow',
    updatedAt: '2026-03-22T08:45:00.000Z',
  },
  {
    id: 'wi-205',
    owner: 'NeuroForge SDX',
    priority: 'Medium',
    status: 'Ready for build',
    title: 'Expose workflow provenance endpoint',
    updatedAt: '2026-03-22T07:55:00.000Z',
  },
];

export const agents: AgentSummary[] = [
  { id: 'agent-1', model: 'gpt-5.4', service: 'planner', status: 'healthy' },
  { id: 'agent-2', model: 'gpt-5.4-mini', service: 'reviewer', status: 'working' },
  { id: 'agent-3', model: 'gpt-5.3-codex', service: 'writer', status: 'idle' },
];

export const softwareFactoryOverview: SoftwareFactoryOverview = {
  activeBuilds: 7,
  gatePassRate: '98.2%',
  openReviews: 5,
  recentBuild: {
    id: 'build-1042',
    name: 'Merchant settlement hardening',
    stage: 'quality-gates',
    status: 'warning',
    updatedAt: '2026-03-22T09:05:00.000Z',
  },
};

export const platformOverview: PlatformOverview = {
  activeAlerts: 3,
  clusterHealth: '5 healthy · 1 warning',
  fleetSync: '98.9%',
  managedWorkspaces: 24,
};

export const clusters: ClusterSummary[] = [
  { id: 'ng-prod', region: 'Nigeria', status: 'healthy', workloadCount: 114 },
  { id: 'za-prod', region: 'South Africa', status: 'healthy', workloadCount: 96 },
  { id: 'eu-prod', region: 'Europe', status: 'warning', workloadCount: 122 },
];

export const workspacesPlatform: WorkspaceSummary[] = [
  { id: 'payments-core', promiseCount: 8, status: 'healthy', tenant: 'payments' },
  { id: 'retail-cloud', promiseCount: 6, status: 'warning', tenant: 'retail' },
];

export const promisesCatalog: PromiseSummary[] = [
  { id: 'hasura-endpoint', owner: 'Data Access', status: 'available', title: 'Hasura Endpoint' },
  { id: 'distributed-sql-service', owner: 'Data Platforms', status: 'available', title: 'YugabyteDB' },
  { id: 'message-stream', owner: 'Messaging', status: 'preview', title: 'JetStream Stream' },
];

export const mockSwaggerDocument = {
  openapi: '3.1.0',
  info: {
    title: 'BAC SDX API',
    version: '0.1.0',
  },
  paths: {
    '/work-items': {
      get: {
        summary: 'List work items',
      },
    },
    '/builds/{buildId}': {
      get: {
        summary: 'Fetch a build',
      },
    },
  },
};
