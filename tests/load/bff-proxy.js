import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up
    { duration: '1m', target: 50 },    // Sustained load
    { duration: '30s', target: 100 },  // Peak
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    errors: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test health endpoint
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, { 'health ok': (r) => r.status === 200 });
  apiLatency.add(healthRes.timings.duration);
  errorRate.add(healthRes.status !== 200);

  // Test BFF proxy - SDX API
  const sdxRes = http.get(`${BASE_URL}/api/proxy/sdx/v1/builds`, {
    headers: { 'Authorization': `Bearer ${__ENV.AUTH_TOKEN || 'test'}` },
  });
  check(sdxRes, { 'sdx proxy ok': (r) => r.status === 200 || r.status === 401 });
  apiLatency.add(sdxRes.timings.duration);

  // Test BFF proxy - Hasura
  const hasuraRes = http.post(`${BASE_URL}/api/proxy/hasura/v1/graphql`, JSON.stringify({
    query: '{ __typename }',
  }), { headers: { 'Content-Type': 'application/json' } });
  check(hasuraRes, { 'hasura proxy ok': (r) => r.status === 200 || r.status === 401 });
  apiLatency.add(hasuraRes.timings.duration);

  sleep(1);
}
