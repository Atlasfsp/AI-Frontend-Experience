export type {
  AgentSummary,
  BuildSummary,
  ClusterSummary,
  PlatformOverview,
  PromiseSummary,
  SoftwareFactoryOverview,
  SwaggerDocument,
  WorkItemSummary,
  WorkspaceSummary,
} from './types';
export type { RequestContext } from './http';
export { requestJson } from './http';
export { BacQueryProvider, createQueryClient } from './hooks';
export { generatedContractBindings, platformAutomationPaths, softwareFactoryPaths } from './generated/contract-registry';
export {
  useAgents,
  useBuild,
  useBuilds,
  useClusters,
  usePlatformOverview,
  usePromises,
  useSoftwareFactoryOverview,
  useSwaggerSpec,
  useWorkItems,
  useWorkspaces,
} from './hooks';
export { getPlatformOverview, listClusters, listPromises, listWorkspaces } from './platform/client';
export { getBuild, getSoftwareFactoryOverview, listAgents, listBuilds, listWorkItems } from './sdx/client';
export { getSwaggerDocument } from './swagger/client';

// Generated typed API clients
export { SoftwareFactoryApiClient } from './generated/software-factory-client';
export { PlatformAutomationApiClient } from './generated/platform-automation-client';
export { createApiClients } from './generated/contract-registry';
export type { ApiClientsConfig } from './generated/contract-registry';

// Generated schema types (re-exported for convenience)
export type {
  CodeRequest,
  CodeResponse,
  DesignRequest,
  DesignResponse,
  PRDRequest,
  PRDResponse,
  PerformanceTestRequest,
  PerformanceTestResponse,
  SecurityFinding,
  SecurityScanRequest,
  SecurityScanResponse,
  WorkflowRequest,
  WorkflowResponse,
  WorkflowStage,
  Pagination,
} from './generated/software-factory-client';

export type {
  ApiError as PlatformApiError,
  ControlPlaneSummary,
  PageInfo,
  RegionSummary,
  ClusterSummary as PlatformClusterSummary,
  WorkspaceSummary as PlatformWorkspaceSummary,
  PromiseSummary as PlatformPromiseSummary,
  IncidentSummary,
  PolicySummary,
  QuotaSummary,
  RegionListResponse,
  ClusterListResponse,
  WorkspaceListResponse,
  PromiseListResponse,
  IncidentListResponse,
} from './generated/platform-automation-client';

// Central API hook (mock/live switching)
export type { ApiClient, ApiMode } from './hooks/use-api';
export { useApiMode, useApiClient } from './hooks/use-api';

// TanStack Query wrapper hooks
export {
  queryKeys,
  useDashboard,
  useBuildsQuery,
  useBuildQuery,
  useWorkItemsQuery,
  useWorkItemQuery,
  useAlertsQuery,
  useAlertQuery,
  useApprovalsQuery,
  useApprovalQuery,
  useApprovalDecision,
  useIncidentsQuery,
  useIncidentQuery,
  useIncidentAcknowledge,
  useClustersQuery,
  useClusterQuery,
  useWorkspacesQuery,
  useWorkspaceQuery,
  useAuditQuery,
  useComplianceQuery,
  usePlatformSummaryQuery,
  useSoftwareFactorySummaryQuery,
} from './hooks/queries';

// WebSocket manager
export { WebSocketManager } from './websocket';
export type { ConnectionState, WebSocketManagerOptions, ChannelHandler, StateChangeHandler, TokenRefresher } from './websocket';

// WebSocket React hook
export { useWebSocket } from './hooks/use-websocket';
export type { UseWebSocketReturn } from './hooks/use-websocket';

// Mock data types (for test utilities)
export type { AuditEntry, ComplianceSummary } from './mock/data';

// Live client hook
export { useLiveClient } from './hooks/use-live-client';

// GraphQL SSE subscription client and hooks
export { HasuraSubscriptionClient } from './platform/subscriptions';
export type { SubscriptionOptions, SubscriptionMessage } from './platform/subscriptions';
export { useSubscription, setSubscriptionClient } from './hooks/use-subscription';
export type { UseSubscriptionResult } from './hooks/use-subscription';
export {
  useIncidentSubscription,
  useClusterHealthSubscription,
  useBuildProgressSubscription,
  useAlertStreamSubscription,
} from './hooks/platform-subscriptions';
export type {
  IncidentChange,
  ClusterHealth,
  BuildProgress,
  AlertStreamItem,
} from './hooks/platform-subscriptions';
