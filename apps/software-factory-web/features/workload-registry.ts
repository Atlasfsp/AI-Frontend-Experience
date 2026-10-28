/**
 * FluxCore workload registry view contract.
 * NOTE: No trusted workload BFF is wired. All records must remain empty until
 * a tenant-authorized, source-labelled reader is implemented and reviewed.
 */
export const workloadKinds = [
  'engineering_job', 'ci_build', 'preview', 'runtime_service', 'data_infra',
] as const;
export type WorkloadKind = (typeof workloadKinds)[number];

export type WorkloadState =
  | 'queued' | 'planning' | 'running' | 'blocked' | 'awaiting_review'
  | 'verified' | 'failed' | 'staged' | 'active' | 'rolled_back'
  | 'completed' | 'retired';

export type WorkloadEvidence =
  | 'DEMO'
  | 'API_REPORTED_UNVERIFIED'
  | 'TRUSTED_CI_VERIFIED'
  | 'STALE'
  | 'UNAVAILABLE';

export interface WorkloadRecordV1 {
  workloadId: string;
  tenantId: string;
  workspaceId: string;
  kind: WorkloadKind;
  name: string;
  repository: string;
  commitSha: string;
  environment: 'sandbox' | 'preview' | 'staging' | 'production';
  state: WorkloadState;
  ownerId: string;
  observedAt: string | null;
  evidenceState: WorkloadEvidence;
  evidenceRef: string | null;
  costMicrosUSD: number | null;
  approvalState: 'not_requested' | 'pending' | 'approved' | 'denied';
  parentWorkloadId: string | null;
}

export interface WorkloadRegistryViewV1 {
  availability: 'NOT_CONNECTED' | 'API_REPORTED_UNVERIFIED';
  records: WorkloadRecordV1[];
  verifiedCount: number | null;
  runningCount: number | null;
  estimatedCostMicrosUSD: number | null;
  releaseAuthority: false;
  integrationRequirements: string[];
}

/** Contract placeholder, NOT a mock of live workload state or a BFF client. */
export function unconnectedWorkloadRegistry(): WorkloadRegistryViewV1 {
  return {
    availability: 'NOT_CONNECTED',
    records: [],
    verifiedCount: null,
    runningCount: null,
    estimatedCostMicrosUSD: null,
    releaseAuthority: false,
    integrationRequirements: [
      'Tenant-scoped authenticated FluxCore read API with pinned source SHA',
      'Independent Jenkins/Tekton evidence verifier + signing issuer provenance',
      'Approved preview/staging registry, workload TTL and artifact digest',
      'VRQGO/OpenTelemetry source timestamps and resource/cost metering',
      'StratoID RBAC, server-side action grant and deployment policy',
    ],
  };
}
