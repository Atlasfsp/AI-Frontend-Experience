import type { RequestContext } from '@bac/api-clients';
import type { BacSession } from '@bac/auth';

export function createFactoryRequestContext(
  session: Pick<BacSession, 'accessToken' | 'tenantId' | 'workspaceId'> | null,
): RequestContext {
  return {
    accessToken: session?.accessToken,
    tenantId: session?.tenantId,
    viaBff: true,
    workspaceId: session?.workspaceId,
  };
}
