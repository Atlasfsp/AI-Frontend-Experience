import { loadWebConfig } from '@bac/config';
import { createLogger, withSpan } from '@bac/observability';

const logger = createLogger({ app: 'api-clients' });

export interface RequestContext {
  accessToken?: string | undefined;
  headers?: HeadersInit;
  method?: string;
  tenantId?: string | undefined;
  useMock?: boolean;
  viaBff?: boolean;
  workspaceId?: string | undefined;
}

export async function requestJson<T>(
  input: string,
  init: RequestInit = {},
  context: RequestContext = {},
): Promise<T> {
  const config = loadWebConfig();
  const headers = new Headers(init.headers);

  headers.set('accept', 'application/json');

  if (context.accessToken) {
    headers.set('authorization', `Bearer ${context.accessToken}`);
  }

  if (context.tenantId) {
    headers.set('x-tenant-id', context.tenantId);
  }

  if (context.workspaceId) {
    headers.set('x-workspace-id', context.workspaceId);
  }

  return withSpan(
    'api.request',
    {
      'bac.mock_api': context.useMock ?? config.enableMockApi,
      'http.url': input,
    },
    async () => {
      const response = await fetch(input, {
        ...init,
        headers,
      });

      if (!response.ok) {
        logger.error('API request failed', {
          status: response.status,
          url: input,
        });
        throw new Error(`Request failed for ${input} with status ${response.status}`);
      }

      return (await response.json()) as T;
    },
  );
}
