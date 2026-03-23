import { NextResponse } from 'next/server';

import { loadAppEnv } from '@/lib/env';

interface UpstreamStatus {
  name: string;
  url: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs: number;
  error?: string;
  checkedAt: string;
}

const TIMEOUT_MS = 5000;

async function checkUpstream(name: string, url: string): Promise<UpstreamStatus> {
  const start = Date.now();
  const checkedAt = new Date().toISOString();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { accept: 'application/json' },
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - start;

    if (response.ok) {
      return { name, url, status: 'healthy', latencyMs, checkedAt };
    }

    return {
      name,
      url,
      status: response.status >= 500 ? 'unhealthy' : 'degraded',
      latencyMs,
      error: `HTTP ${response.status}`,
      checkedAt,
    };
  } catch (error) {
    const latencyMs = Date.now() - start;
    const message = error instanceof Error ? error.message : 'Unknown error';

    return {
      name,
      url,
      status: 'unhealthy',
      latencyMs,
      error: message,
      checkedAt,
    };
  }
}

export async function GET() {
  const env = loadAppEnv();

  const upstreams = [
    { name: 'SDX API', url: `${env.sdxApiUrl}/health` },
    { name: 'Hasura', url: `${env.hasuraUrl.replace('/v1/graphql', '/healthz')}` },
    { name: 'Authentik', url: `${env.authBaseUrl}/-/health/ready/` },
  ];

  const results = await Promise.all(
    upstreams.map((upstream) => checkUpstream(upstream.name, upstream.url)),
  );

  const overallStatus = results.every((r) => r.status === 'healthy')
    ? 'healthy'
    : results.some((r) => r.status === 'unhealthy')
      ? 'unhealthy'
      : 'degraded';

  return NextResponse.json({
    status: overallStatus,
    upstreams: results,
    checkedAt: new Date().toISOString(),
  });
}
