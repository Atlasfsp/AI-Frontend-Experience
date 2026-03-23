import type {
  AgentSummary,
  AlertItem,
  ApprovalItem,
  BuildSummary,
  ClusterSummary,
  DashboardSummary,
  IncidentItem,
  PlatformOverview,
  PromiseSummary,
  SoftwareFactoryOverview,
  WorkItemSummary,
  WorkspaceSummary,
} from '@bac/domain-contracts';

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

export const alerts: AlertItem[] = [
  {
    id: 'alert-001',
    title: 'Build gate failure rate spike',
    summary: 'Quality gate failure rate exceeded 5% threshold in the last hour.',
    severity: 'warning',
    category: 'gate.failed',
    source: 'software-factory',
    status: 'active',
    acknowledged: false,
    owner: 'SDX Team',
    workspaceId: 'payments-core',
    openedAt: '2026-03-22T08:15:00.000Z',
    detailLines: ['Gate: security-scan', 'Failure rate: 7.2%', 'Threshold: 5%'],
    runbookHref: '/runbooks/gate-failure-spike',
    targetHref: '/builds?filter=failed-gates',
  },
  {
    id: 'alert-002',
    title: 'Cluster eu-prod unhealthy',
    summary: 'EU production cluster reporting degraded node health.',
    severity: 'critical',
    category: 'cluster.unhealthy',
    source: 'platform-automation',
    status: 'investigating',
    acknowledged: true,
    owner: 'Platform Ops',
    workspaceId: 'retail-cloud',
    openedAt: '2026-03-22T07:30:00.000Z',
    detailLines: ['Node pool: workers-a', '3 of 8 nodes not ready'],
    runbookHref: '/runbooks/cluster-health',
    targetHref: '/clusters/eu-prod',
    incidentHref: '/incidents/inc-101',
  },
];

export const approvals: ApprovalItem[] = [
  {
    id: 'approval-001',
    title: 'Deploy merchant-api v2.4.1 to ng-prod',
    summary: 'Production deployment of merchant API with settlement hardening changes.',
    kind: 'deployment',
    risk: 'high',
    status: 'pending',
    requester: 'ci-pipeline',
    requestedAt: '2026-03-22T09:10:00.000Z',
    dueAt: '2026-03-22T12:00:00.000Z',
    workspaceId: 'payments-core',
    checks: ['security-scan: passed', 'load-test: passed', 'compliance: pending'],
    targetHref: '/builds/build-1042',
  },
  {
    id: 'approval-002',
    title: 'Grant admin access to retail-cloud workspace',
    summary: 'Access request for new team member to retail cloud workspace.',
    kind: 'access',
    risk: 'moderate',
    status: 'waiting',
    requester: 'jane.doe@example.com',
    requestedAt: '2026-03-22T08:00:00.000Z',
    dueAt: '2026-03-22T17:00:00.000Z',
    workspaceId: 'retail-cloud',
    checks: ['identity-verified: passed', 'manager-approval: pending'],
    targetHref: '/workspaces/retail-cloud/access',
  },
];

export const incidents: IncidentItem[] = [
  {
    id: 'inc-101',
    title: 'EU cluster node pool degradation',
    summary: 'Multiple worker nodes in eu-prod reporting not-ready status, impacting workload scheduling.',
    severity: 'critical',
    status: 'investigating',
    impact: 'Degraded scheduling capacity in EU region. 15% of pods pending.',
    owner: 'Platform Ops',
    service: 'platform-automation',
    openedAt: '2026-03-22T07:32:00.000Z',
    runbookHref: '/runbooks/cluster-health',
    targetHref: '/clusters/eu-prod',
    timeline: [
      {
        id: 'evt-1',
        title: 'Alert triggered',
        detail: 'Cluster health check detected 3 unhealthy nodes.',
        actor: 'monitoring-agent',
        timestamp: '2026-03-22T07:30:00.000Z',
      },
      {
        id: 'evt-2',
        title: 'Incident created',
        detail: 'Auto-created incident from critical cluster alert.',
        actor: 'system',
        timestamp: '2026-03-22T07:32:00.000Z',
      },
    ],
  },
];

export interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  resource: string;
  timestamp: string;
  detail: string;
}

export const auditLog: AuditEntry[] = [
  {
    id: 'audit-001',
    action: 'approval.decided',
    actor: 'admin@example.com',
    resource: 'approval-001',
    timestamp: '2026-03-22T09:20:00.000Z',
    detail: 'Approved deployment of merchant-api v2.4.1.',
  },
  {
    id: 'audit-002',
    action: 'incident.acknowledged',
    actor: 'ops@example.com',
    resource: 'inc-101',
    timestamp: '2026-03-22T07:45:00.000Z',
    detail: 'Acknowledged EU cluster degradation incident.',
  },
];

export interface ComplianceSummary {
  overallScore: number;
  totalChecks: number;
  passingChecks: number;
  failingChecks: number;
  lastScanAt: string;
  frameworks: Array<{ name: string; score: number; status: string }>;
}

export const complianceSummary: ComplianceSummary = {
  overallScore: 94,
  totalChecks: 128,
  passingChecks: 120,
  failingChecks: 8,
  lastScanAt: '2026-03-22T06:00:00.000Z',
  frameworks: [
    { name: 'SOC2', score: 96, status: 'compliant' },
    { name: 'ISO27001', score: 92, status: 'compliant' },
    { name: 'PCI-DSS', score: 94, status: 'compliant' },
  ],
};

export const dashboardSummary: DashboardSummary = {
  activeWorkspace: 'payments-core',
  role: 'ADMIN',
  metrics: [
    { id: 'metric-builds', label: 'Active Builds', value: '7', hint: '2 in quality gates', tone: 'info' },
    { id: 'metric-alerts', label: 'Active Alerts', value: '3', hint: '1 critical', tone: 'warning' },
    { id: 'metric-clusters', label: 'Cluster Health', value: '5/6', hint: '1 warning', tone: 'success' },
    { id: 'metric-compliance', label: 'Compliance', value: '94%', hint: '8 failing checks', tone: 'info' },
  ],
  briefings: [
    {
      id: 'briefing-1',
      title: 'EU cluster degradation',
      description: 'Worker nodes in eu-prod are experiencing scheduling issues.',
      emphasis: 'Investigating - Platform Ops assigned.',
    },
  ],
  shortcuts: [
    { id: 'shortcut-builds', label: 'Builds', description: 'View active builds', href: '/builds', tone: 'info' },
    { id: 'shortcut-alerts', label: 'Alerts', description: 'View active alerts', href: '/alerts', tone: 'warning' },
  ],
  costSummary: '$12,450/mo across 6 clusters',
  pendingSyncCount: 2,
};

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
