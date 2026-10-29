import { loadWebConfig } from '@bac/config';

import { requestJson } from '../http';
import { agents, builds, softwareFactoryOverview, workItems } from '../mock/data';
import type { RequestContext } from '../http';
import type {
  AgentSummary,
  BuildSummary,
  SoftwareFactoryOverview,
  WorkItemSummary,
} from '../types';

function resolveSdxUrl(path: string, context: RequestContext) {
  const config = loadWebConfig();

  if (context.viaBff ?? config.proxyThroughBff) {
    return `/api/proxy/sdx/${path}`;
  }

  return `${config.sdxApiUrl}/${path}`;
}

export async function getSoftwareFactoryOverview(
  context: RequestContext = {},
): Promise<SoftwareFactoryOverview> {
  const config = loadWebConfig();
  if (context.useMock ?? config.enableMockApi) {
    return softwareFactoryOverview;
  }

  return requestJson(resolveSdxUrl('api/dashboard/overview', context), {}, context);
}

export async function listWorkItems(context: RequestContext = {}): Promise<WorkItemSummary[]> {
  const config = loadWebConfig();
  if (context.useMock ?? config.enableMockApi) {
    return workItems;
  }

  return requestJson<WorkItemSummary[]>(resolveSdxUrl('api/work-items', context), {}, context);
}

export async function listBuilds(context: RequestContext = {}): Promise<BuildSummary[]> {
  const config = loadWebConfig();
  if (context.useMock ?? config.enableMockApi) {
    return builds;
  }

  return requestJson(resolveSdxUrl('api/builds', context), {}, context);
}

export async function getBuild(
  buildId: string,
  context: RequestContext = {},
): Promise<BuildSummary> {
  const config = loadWebConfig();
  if (context.useMock ?? config.enableMockApi) {
    return (
      builds.find((build) => build.id === buildId) ?? {
        id: buildId,
        name: 'Unknown build',
        stage: 'queued',
        status: 'neutral',
        updatedAt: new Date().toISOString(),
      }
    );
  }

  return requestJson(resolveSdxUrl(`api/builds/${buildId}`, context), {}, context);
}

export async function listAgents(context: RequestContext = {}): Promise<AgentSummary[]> {
  const config = loadWebConfig();
  if (context.useMock ?? config.enableMockApi) {
    return agents;
  }

  return requestJson(resolveSdxUrl('api/agents', context), {}, context);
}
