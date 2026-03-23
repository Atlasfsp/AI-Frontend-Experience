import { loadWebConfig } from '@bac/config';

import { requestJson } from '../http';
import { clusters, platformOverview, promisesCatalog, workspacesPlatform } from '../mock/data';
import type { RequestContext } from '../http';
import type {
  ClusterSummary,
  PlatformOverview,
  PromiseSummary,
  WorkspaceSummary,
} from '../types';

function resolvePlatformUrl(path: string, context: RequestContext) {
  const config = loadWebConfig();

  if (context.viaBff ?? config.proxyThroughBff) {
    return `/api/proxy/hasura/${path}`;
  }

  return `${config.platformApiUrl}/${path}`;
}

export async function getPlatformOverview(
  context: RequestContext = {},
): Promise<PlatformOverview> {
  const config = loadWebConfig();
  if (context.useMock ?? config.enableMockApi) {
    return platformOverview;
  }

  return requestJson(resolvePlatformUrl('api/overview', context), {}, context);
}

export async function listClusters(context: RequestContext = {}): Promise<ClusterSummary[]> {
  const config = loadWebConfig();
  if (context.useMock ?? config.enableMockApi) {
    return clusters;
  }

  return requestJson(resolvePlatformUrl('api/clusters', context), {}, context);
}

export async function listWorkspaces(context: RequestContext = {}): Promise<WorkspaceSummary[]> {
  const config = loadWebConfig();
  if (context.useMock ?? config.enableMockApi) {
    return workspacesPlatform;
  }

  return requestJson(resolvePlatformUrl('api/workspaces', context), {}, context);
}

export async function listPromises(context: RequestContext = {}): Promise<PromiseSummary[]> {
  const config = loadWebConfig();
  if (context.useMock ?? config.enableMockApi) {
    return promisesCatalog;
  }

  return requestJson(resolvePlatformUrl('api/promises', context), {}, context);
}
