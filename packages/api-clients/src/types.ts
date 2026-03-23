/**
 * Re-exports canonical domain types from @bac/domain-contracts for backward compatibility.
 * New code should import directly from @bac/domain-contracts.
 */

export type {
  AgentSummary,
  BuildSummary,
  ClusterSummary,
  PlatformOverview,
  PromiseSummary,
  SoftwareFactoryOverview,
  WorkItemSummary,
  WorkspaceSummary,
} from '@bac/domain-contracts';

/** Swagger document type is specific to the api-clients package. */
export interface SwaggerDocument {
  info: {
    title: string;
    version: string;
  };
  openapi: string;
  paths: Record<string, unknown>;
}
