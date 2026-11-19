import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { hasPermission, sessionCookieName } from '@bac/auth';

import { resolveSdxPermission } from '@/lib/sdx-permissions';
import { loadAppEnv } from '@/lib/env';
import { readRequestSession } from '@/lib/auth';

const maxBodyBytes = 64 * 1024;
const forwardedRequestHeaders = ['accept', 'content-type', 'idempotency-key', 'traceparent', 'tracestate'];
const forwardedResponseHeaders = ['content-type', 'idempotent-replay', 'cache-control', 'retry-after', 'traceparent'];

function deny(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

/**
 * The FluxCore API makes the final tenant decision, but a browser-supplied
 * tenant_id that differs from the signed session is refused here so a forged
 * scope never reaches the backend with this session's credentials.
 */
function tenantMismatch(values: unknown[], tenantId: string) {
  return values.some((value) => value !== undefined && value !== tenantId);
}

async function proxy(request: NextRequest, path: string[]) {
  const env = loadAppEnv();
  const session = await readRequestSession(request.cookies.get(sessionCookieName)?.value);
  const permission = resolveSdxPermission(request.method, path);

  if (!permission) return deny(404, 'not_found');
  if (!session || !hasPermission(session, permission)) return deny(403, 'forbidden');
  if (session.authMode === 'mock' && env.environment !== 'development') return deny(403, 'forbidden');

  if (tenantMismatch(request.nextUrl.searchParams.getAll('tenant_id'), session.tenantId)) {
    return deny(403, 'tenant_mismatch');
  }

  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.text();
    if (new TextEncoder().encode(body).byteLength > maxBodyBytes) return deny(413, 'payload_too_large');
    if (body.trim()) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(body);
      } catch {
        return deny(400, 'invalid_json');
      }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return deny(400, 'invalid_json');
      if (tenantMismatch([(parsed as Record<string, unknown>).tenant_id], session.tenantId)) {
        return deny(403, 'tenant_mismatch');
      }
    }
  }

  const target = new URL(path.join('/'), `${env.sdxApiUrl.replace(/\/$/, '')}/`);
  target.search = request.nextUrl.search;

  const headers = new Headers();
  if (session.accessToken) {
    headers.set('authorization', `Bearer ${session.accessToken}`);
  }
  headers.set('x-tenant-id', session.tenantId);
  headers.set('x-fluxcore-tenant-id', session.tenantId);
  headers.set('x-workspace-id', session.workspaceId);
  for (const name of forwardedRequestHeaders) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const init: RequestInit =
    body === undefined
      ? { cache: 'no-store', headers, method: request.method }
      : { body, cache: 'no-store', headers, method: request.method };

  let response: Response;
  try {
    response = await fetch(target, init);
  } catch {
    return deny(502, 'upstream_unavailable');
  }

  const responseHeaders = new Headers();
  for (const name of forwardedResponseHeaders) {
    const value = response.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  return new NextResponse(response.body, { headers: responseHeaders, status: response.status });
}

type ProxyContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: ProxyContext) {
  return proxy(request, (await context.params).path);
}

export async function POST(request: NextRequest, context: ProxyContext) {
  return proxy(request, (await context.params).path);
}

export async function PUT(request: NextRequest, context: ProxyContext) {
  return proxy(request, (await context.params).path);
}
