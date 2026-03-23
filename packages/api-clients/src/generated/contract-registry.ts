export interface GeneratedContractBinding {
  readonly producerRepo: string;
  readonly artifactId: string;
  readonly version: string;
  readonly releaseTag: string | null;
  readonly endpointCount: number;
  readonly endpoints: readonly string[];
  readonly generatedAt: string;
}

export const softwareFactoryPaths = [
  "/auth/login",
  "/auth/refresh",
  "/code/generate",
  "/code/test",
  "/design/tokens",
  "/design/wireframes",
  "/health/live",
  "/health/ready",
  "/performance/results/{test_id}",
  "/performance/test",
  "/prd/generate",
  "/prd/{prd_id}",
  "/security/findings/{scan_id}",
  "/security/scan",
  "/workflows",
  "/workflows/{workflow_id}",
  "/workflows/{workflow_id}/artifacts"
] as const;

export const platformAutomationPaths = [
  "/v1/clusters",
  "/v1/control-plane/summary",
  "/v1/incidents",
  "/v1/policy/summary",
  "/v1/promises",
  "/v1/quotas/summary",
  "/v1/regions",
  "/v1/workspaces"
] as const;

export const generatedContractBindings: readonly GeneratedContractBinding[] = [
  {
    producerRepo: 'ai-software-factory',
    artifactId: 'software-factory-openapi',
    version: '1.0.0',
    releaseTag: null,
    endpointCount: softwareFactoryPaths.length,
    endpoints: softwareFactoryPaths,
    generatedAt: '2026-03-23T04:59:42.682Z',
  },
  {
    producerRepo: 'ai-platform-automation',
    artifactId: 'platform-automation-openapi',
    version: '1.0.0',
    releaseTag: null,
    endpointCount: platformAutomationPaths.length,
    endpoints: platformAutomationPaths,
    generatedAt: '2026-03-23T04:59:42.682Z',
  },
] as const;
