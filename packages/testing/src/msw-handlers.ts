import { http, HttpResponse } from 'msw';

import { buildFixture, workItemFixture } from './fixtures';

export const handlers = [
  http.get('http://localhost:8080/api/dashboard/overview', () =>
    HttpResponse.json({
      activeBuilds: 7,
      gatePassRate: '98.2%',
      recentBuild: buildFixture,
    }),
  ),
  http.get('http://localhost:8080/api/work-items', () => HttpResponse.json([workItemFixture])),
];
