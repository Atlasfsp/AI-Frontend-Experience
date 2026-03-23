import type { ChartDatum, TimelineItem, WorkspaceOption } from '@bac/ui';

export const softwareFactoryWorkspaceOptions: WorkspaceOption[] = [
  {
    description: 'Primary software delivery workspace for the AI Software Factory control plane.',
    environment: 'Production',
    id: 'workspace-core',
    label: 'workspace-core',
    status: 'success',
    tenant: 'tenant-echo',
  },
  {
    description: 'Preview workspace for agent runtime and BFF changes before promotion.',
    environment: 'Preview',
    id: 'workspace-preview',
    label: 'workspace-preview',
    status: 'warning',
    tenant: 'tenant-echo',
  },
  {
    description: 'Dedicated validation lane for policy, attestation, and rollback rehearsal.',
    environment: 'Validation',
    id: 'workspace-release-lab',
    label: 'workspace-release-lab',
    status: 'neutral',
    tenant: 'tenant-echo',
  },
];

export const buildTrendChart: ChartDatum[] = [
  { annotation: 'Builds that cleared all release gates today', label: 'Passed', tone: 'emerald', value: 11 },
  { annotation: 'Builds paused for manual policy review', label: 'Review', tone: 'amber', value: 4 },
  { annotation: 'Builds with blocking quality issues', label: 'Blocked', tone: 'rose', value: 2 },
  { annotation: 'Queued work entering the build mesh', label: 'Queued', tone: 'cyan', value: 7 },
];

export const prdReadinessChart: ChartDatum[] = [
  { annotation: 'Problem and success criteria are explicit', label: 'Outcome clarity', tone: 'emerald', value: 91 },
  { annotation: 'Interfaces and data dependencies captured', label: 'Contract coverage', tone: 'cyan', value: 84 },
  { annotation: 'Controls and release gates attached early', label: 'Compliance readiness', tone: 'amber', value: 73 },
];

export const architectureStreams: ChartDatum[] = [
  { annotation: 'Requirement shaping and PRD workflow', label: 'Product intake', tone: 'cyan', value: 8 },
  { annotation: 'Architecture, ADRs, and contracts', label: 'Design authority', tone: 'emerald', value: 6 },
  { annotation: 'Build, review, and promotion orchestration', label: 'Execution system', tone: 'amber', value: 9 },
];

export const domainModelRows = [
  {
    aggregate: 'Project',
    boundary: 'Factory Planning',
    id: 'project',
    invariant: 'Every project maps to one tenant and one active workspace.',
    signals: 'owner, priority, roadmapState',
  },
  {
    aggregate: 'PRD',
    boundary: 'Requirement Intake',
    id: 'prd',
    invariant: 'A PRD cannot progress without acceptance criteria and API impact notes.',
    signals: 'businessOutcome, risks, successMetrics',
  },
  {
    aggregate: 'Build',
    boundary: 'Execution Mesh',
    id: 'build',
    invariant: 'A build promotion requires complete provenance and passing gates.',
    signals: 'stage, status, provenanceRef',
  },
  {
    aggregate: 'Release',
    boundary: 'Promotion and Rollout',
    id: 'release',
    invariant: 'Only one active release candidate may own a deployment lane at a time.',
    signals: 'window, approvers, rolloutState',
  },
];

export const adrRows = [
  {
    date: '2026-03-20',
    decision: 'Use BFF proxy routes for all product-facing contract exploration.',
    id: 'adr-021',
    owner: 'Frontend Platform',
    status: 'Accepted',
  },
  {
    date: '2026-03-18',
    decision: 'Model release evidence as first-class compliance artifacts.',
    id: 'adr-020',
    owner: 'Release Engineering',
    status: 'Accepted',
  },
  {
    date: '2026-03-12',
    decision: 'Keep generated API clients isolated behind `@bac/api-clients` seams.',
    id: 'adr-019',
    owner: 'Platform Architecture',
    status: 'Accepted',
  },
];

export const apiContractRows = [
  {
    client: 'sdx/client.ts',
    id: 'contract-work-items',
    method: 'GET',
    owner: 'NeuroForge SDX',
    path: '/api/work-items',
    summary: 'List work items ready for planning or execution.',
  },
  {
    client: 'sdx/client.ts',
    id: 'contract-builds',
    method: 'GET',
    owner: 'NeuroForge SDX',
    path: '/api/builds/{buildId}',
    summary: 'Fetch build status, stage, and promotion readiness.',
  },
  {
    client: 'swagger/client.ts',
    id: 'contract-openapi',
    method: 'GET',
    owner: 'Frontend Experience',
    path: '/api/openapi/openapi.json',
    summary: 'Resolve the OpenAPI artifact used by the Swagger explorer.',
  },
];

export const releaseRows = [
  {
    candidate: 'Merchant settlement hardening',
    id: 'release-1042',
    owner: 'Release Manager',
    risk: 'medium',
    status: 'Awaiting compliance sign-off',
    window: '2026-03-22 20:00 UTC',
  },
  {
    candidate: 'Platform bootstrap telemetry',
    id: 'release-1043',
    owner: 'Operations',
    risk: 'low',
    status: 'Ready to promote',
    window: '2026-03-22 18:30 UTC',
  },
];

export const accessRows = [
  {
    id: 'role-operator',
    principal: 'operator@stratogroup.dev',
    role: 'OPERATOR',
    scope: 'workspace-core',
    status: 'Active',
  },
  {
    id: 'role-release',
    principal: 'release@stratogroup.dev',
    role: 'ADMIN',
    scope: 'workspace-release-lab',
    status: 'Pending rotation',
  },
];

export const auditRows = [
  {
    action: 'Release approval recorded',
    actor: 'release@stratogroup.dev',
    id: 'audit-1',
    target: 'release-1042',
    timestamp: '2026-03-22T09:18:00Z',
  },
  {
    action: 'Swagger explorer opened',
    actor: 'operator@stratogroup.dev',
    id: 'audit-2',
    target: 'sdx-openapi',
    timestamp: '2026-03-22T09:08:00Z',
  },
];

export const softwareFactoryTimeline: TimelineItem[] = [
  {
    actor: 'Planner',
    description: 'PRD scope locked and architecture references attached for the settlement hardening stream.',
    status: 'success',
    time: '09:00 UTC',
    title: 'PRD intake moved to ready',
  },
  {
    actor: 'Reviewer',
    description: 'Quality gate review paused one build after a dependency exception needed policy sign-off.',
    status: 'warning',
    time: '09:12 UTC',
    title: 'Security review escalation',
  },
  {
    actor: 'Release Manager',
    description: 'Release window prepared for the telemetry rollout with rollback bundle linked.',
    status: 'neutral',
    time: '09:24 UTC',
    title: 'Release candidate staged',
  },
];

export const complianceTerminalLines = [
  '$ bac compliance inspect --build build-1042 --format terminal',
  'control release_evidence ............... pass',
  'control dependency_vulnerability ....... review-required',
  'control provenance_bundle .............. pass',
  'control rollback_bundle ................ pass',
  'control policy_exception_window ........ expires in 3h',
  '',
  'next_action: request security waiver approval',
];

export const prdTemplateSnippet = `type PrdIntake = {
  title: string;
  businessOutcome: string;
  successMetrics: string[];
  apiImpact: Array<{ service: string; contract: string }>;
  releaseControls: string[];
};`;

export const sdkIntegrationSnippet = `import { getBuild, getSwaggerDocument, listWorkItems } from '@bac/api-clients';

const build = await getBuild('build-1042', {
  tenantId: session.tenantId,
  workspaceId: session.workspaceId,
  viaBff: true,
});

const swagger = await getSwaggerDocument({ viaBff: true });
const workItems = await listWorkItems({ viaBff: true });`;

export const swaggerSnippet = `openapi: 3.1.0
info:
  title: BAC SDX API
  version: 0.1.0
paths:
  /work-items:
    get:
      summary: List work items
  /builds/{buildId}:
    get:
      summary: Fetch build state`;

export const softwareFactoryQuickActions = [
  {
    description: 'Jump directly to the PRD intake flow and ready-check panels.',
    href: '/software-factory/prd-intake',
    label: 'New PRD',
  },
  {
    description: 'Inspect generated SDK seams and live OpenAPI surface.',
    href: '/software-factory/swagger',
    label: 'Inspect Swagger',
  },
  {
    description: 'Review candidate promotion posture and release controls.',
    href: '/software-factory/release-manager',
    label: 'Release queue',
  },
];
