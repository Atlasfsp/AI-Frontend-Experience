'use client';

import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

import { getPlatformOverview, listClusters, listPromises, listWorkspaces } from './platform/client';
import { useHasuraSubscription } from './platform/hooks';
import { getBuild, getSoftwareFactoryOverview, listAgents, listBuilds, listWorkItems } from './sdx/client';
import { getSwaggerDocument } from './swagger/client';
import { platformOverview } from './mock/data';
import type { RequestContext } from './http';

export function createQueryClient() {
  return new QueryClient();
}

export function BacQueryProvider({
  children,
  client,
}: {
  children: React.ReactNode;
  client?: QueryClient;
}) {
  return <QueryClientProvider client={client ?? createQueryClient()}>{children}</QueryClientProvider>;
}

export function useSoftwareFactoryOverview(context?: RequestContext) {
  return useQuery({
    queryKey: ['sdx', 'overview'],
    queryFn: () => getSoftwareFactoryOverview(context),
  });
}

export function useWorkItems(context?: RequestContext) {
  return useQuery({
    queryKey: ['sdx', 'work-items'],
    queryFn: () => listWorkItems(context),
  });
}

export function useBuilds(context?: RequestContext) {
  return useQuery({
    queryKey: ['sdx', 'builds'],
    queryFn: () => listBuilds(context),
  });
}

export function useBuild(buildId: string, context?: RequestContext) {
  return useQuery({
    queryKey: ['sdx', 'build', buildId],
    queryFn: () => getBuild(buildId, context),
  });
}

export function useAgents(context?: RequestContext) {
  return useQuery({
    queryKey: ['sdx', 'agents'],
    queryFn: () => listAgents(context),
  });
}

export function usePlatformOverview(context?: RequestContext) {
  return useQuery({
    queryKey: ['platform', 'overview'],
    queryFn: () => getPlatformOverview(context),
  });
}

export function useClusters(context?: RequestContext) {
  return useQuery({
    queryKey: ['platform', 'clusters'],
    queryFn: () => listClusters(context),
  });
}

export function useWorkspaces(context?: RequestContext) {
  return useQuery({
    queryKey: ['platform', 'workspaces'],
    queryFn: () => listWorkspaces(context),
  });
}

export function usePromises(context?: RequestContext) {
  return useQuery({
    queryKey: ['platform', 'promises'],
    queryFn: () => listPromises(context),
  });
}

export function useSwaggerSpec(context?: RequestContext) {
  return useQuery({
    queryKey: ['swagger', 'spec'],
    queryFn: () => getSwaggerDocument(context),
  });
}

export function useLivePlatformOverview() {
  return useHasuraSubscription('/api/proxy/hasura/subscriptions/platform-overview', platformOverview);
}

/* Re-export subscription hooks for convenience */
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
