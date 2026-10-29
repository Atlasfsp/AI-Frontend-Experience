import { describe, expect, it } from 'vitest';

import { listSharedEngineeringProjects } from './projects';

const accessToken = process.env.FLUXCORE_AUTHENTIK_LOCAL_ACCESS_TOKEN;
const hasuraUrl = process.env.FLUXCORE_LOCAL_HASURA_URL;
const apiUrl = process.env.FLUXCORE_LOCAL_API_URL;

describe('live local Authentik project journey', () => {
  it.skipIf(!accessToken || !hasuraUrl || !apiUrl)(
    'authorizes the real Authentik bearer token through FluxCore and reads its Hasura tenant rows',
    async () => {
      const result = await listSharedEngineeringProjects(
        hasuraUrl!,
        `${apiUrl!.replace(/\/$/, '')}/v1/projects/read-authorization`,
        accessToken,
      );

      expect(result.status).toBe('available');
      if (result.status !== 'available') return;
      expect(result.projects).toHaveLength(1);
      expect(result.projects[0]?.name).toBe('FluxCore local integration project');
      expect(result.projects[0]?.workforcePlan.execution_authorized).toBe(false);
    },
  );
});
