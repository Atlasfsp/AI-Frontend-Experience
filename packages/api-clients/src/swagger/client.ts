import { loadWebConfig } from '@bac/config';

import { requestJson } from '../http';
import { mockSwaggerDocument } from '../mock/data';
import type { RequestContext } from '../http';
import type { SwaggerDocument } from '../types';

export async function getSwaggerDocument(
  context: RequestContext = {},
): Promise<SwaggerDocument> {
  const config = loadWebConfig();
  if (context.useMock ?? config.enableMockApi) {
    return mockSwaggerDocument;
  }

  return requestJson(config.swaggerUrl, {}, context);
}
