import type { ChartDatum, TimelineItem, WorkspaceOption } from '@bac/ui';

export const platformWorkspaceOptions: WorkspaceOption[] = [
  {
    description: 'Primary tenant factory workspace for control plane operations.',
    environment: 'Production',
    id: 'workspace-core',
    label: 'workspace-core',
    status: 'success',
    tenant: 'tenant-echo',
  },
  {
    description: 'Regional staging lane for GitOps and promise rollout validation.',
    environment: 'Staging',
    id: 'workspace-regional-staging',
    label: 'workspace-regional-staging',
    status: 'warning',
    tenant: 'tenant-platform',
  },
];

export const controlPlaneChart: ChartDatum[] = [
  { annotation: 'Clusters fully converged with declared GitOps state', label: 'In sync', tone: 'emerald', value: 15 },
  { annotation: 'Tenants awaiting workspace provisioning actions', label: 'Provisioning', tone: 'cyan', value: 6 },
  { annotation: 'Policy findings requiring operator review', label: 'Findings', tone: 'amber', value: 3 },
];

export const regionRows = [
  { availability: '99.98%', capacity: 'Healthy', id: 'ng', name: 'Nigeria', workloads: 114 },
  { availability: '99.97%', capacity: 'Healthy', id: 'za', name: 'South Africa', workloads: 96 },
  { availability: '99.91%', capacity: 'Tight', id: 'eu', name: 'Europe', workloads: 122 },
];

export const workspaceFactoryRows = [
  {
    id: 'factory-1',
    requestedBy: 'tenant-ops@stratogroup.dev',
    serviceClass: 'regulated-enterprise',
    stage: 'Awaiting policy approval',
    workspace: 'tenant-ledger-prod',
  },
  {
    id: 'factory-2',
    requestedBy: 'platform@stratogroup.dev',
    serviceClass: 'shared-observability',
    stage: 'Provisioning regional claims',
    workspace: 'tenant-observability-stg',
  },
];

export const gitopsRows = [
  { drift: 'none', id: 'gitops-ng', status: 'Converged', target: 'ng-prod', updatedAt: '2m ago' },
  { drift: '2 manifests', id: 'gitops-eu', status: 'Review required', target: 'eu-prod', updatedAt: '1m ago' },
  { drift: 'none', id: 'gitops-za', status: 'Converged', target: 'za-prod', updatedAt: '4m ago' },
];

export const policyRows = [
  {
    control: 'Workspace factory policy',
    id: 'policy-1',
    owner: 'Platform Policy',
    severity: 'medium',
    status: 'Review required',
  },
  {
    control: 'Hasura endpoint console disabled',
    id: 'policy-2',
    owner: 'Data Access',
    severity: 'low',
    status: 'Passing',
  },
];

export const identityRows = [
  {
    id: 'identity-1',
    provider: 'Authentik',
    rotation: 'Scheduled weekly',
    status: 'Healthy',
    subject: 'OIDC workforce',
  },
  {
    id: 'identity-2',
    provider: 'SpiceDB',
    rotation: 'Schema review monthly',
    status: 'Healthy',
    subject: 'Authorization graph',
  },
];

export const incidentRows = [
  {
    id: 'incident-1',
    owner: 'VictoriaStack',
    recovery: 'Failover drill in 35m',
    severity: 'SEV-2',
    summary: 'Regional scrape lag in Europe',
  },
  {
    id: 'incident-2',
    owner: 'GitOps',
    recovery: 'Rollback bundle ready',
    severity: 'SEV-3',
    summary: 'Fleet drift for payments namespace',
  },
];

export const quotaRows = [
  { budget: '$42k / $55k', id: 'quota-1', service: 'Regional clusters', trend: 'On track', utilization: '76%' },
  { budget: '$18k / $22k', id: 'quota-2', service: 'Data access planes', trend: 'Watch', utilization: '82%' },
  { budget: '$9k / $14k', id: 'quota-3', service: 'Observability stack', trend: 'Healthy', utilization: '64%' },
];

export const runbookRows = [
  {
    audience: 'Platform Operators',
    id: 'runbook-1',
    route: '/runbooks#region-failover',
    title: 'Regional failover rehearsal',
  },
  {
    audience: 'Workspace Factory',
    id: 'runbook-2',
    route: '/runbooks#tenant-onboarding',
    title: 'Tenant workspace onboarding',
  },
  {
    audience: 'Data Access',
    id: 'runbook-3',
    route: '/runbooks#hasura-endpoints',
    title: 'Hasura endpoint incident response',
  },
];

export const observabilityTimeline: TimelineItem[] = [
  {
    actor: 'OpenTelemetry collector',
    description: 'Regional trace fanout recovered after a short exporter throttle event.',
    status: 'success',
    time: '08:50 UTC',
    title: 'Trace path normalized',
  },
  {
    actor: 'Policy engine',
    description: 'Quota alert fired for data access plane memory growth in one workspace shard.',
    status: 'warning',
    time: '09:05 UTC',
    title: 'Quota anomaly detected',
  },
  {
    actor: 'DR coordinator',
    description: 'Disaster recovery center scheduled a Europe failover rehearsal for the next release window.',
    status: 'neutral',
    time: '09:20 UTC',
    title: 'DR drill staged',
  },
];

export const platformQuickActions = [
  {
    description: 'Review cluster convergence and current GitOps drift posture.',
    href: '/platform/gitops',
    label: 'Fleet status',
  },
  {
    description: 'Open the tenant and workspace provisioning factory.',
    href: '/platform/workspace-factory',
    label: 'New workspace',
  },
  {
    description: 'Inspect live incidents and DR workflows.',
    href: '/platform/incidents',
    label: 'Incident center',
  },
];

export const quotaTerminalLines = [
  '$ bac platform quotas inspect --scope tenant-echo',
  'cpu_reserved ................. 78%',
  'memory_reserved .............. 81%',
  'storage_allocated ............ 62%',
  'gitops_rollout_budget ........ healthy',
  'cost_anomaly_score ........... watch',
  '',
  'recommendation: shift one preview workspace to ng-staging',
];

export const gitopsSnippet = `apiVersion: fleet.cattle.io/v1alpha1
kind: GitRepo
metadata:
  name: bac-platform-core
spec:
  repo: https://github.com/bac/platform-automation
  paths:
    - clusters/ng
    - clusters/za
    - clusters/eu`;
