import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { hasPermission } from '@bac/auth';

import { resolveSdxPermission } from '@/lib/sdx-permissions';
import { loadAppEnv } from '@/lib/env';
import { readRequestSession } from '@/lib/auth';

async function proxy(request: NextRequest, path: string[]) {
  const env = loadAppEnv();
  const session = await readRequestSession(request.cookies.get('bac_session')?.value);
  const permission = resolveSdxPermission(request.method, path);

  if (!permission) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  if (!session || !hasPermission(session, permission)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const target = new URL(path.join('/'), `${env.sdxApiUrl.replace(/\/$/, '')}/`);
  target.search = request.nextUrl.search;

  const headers = new Headers();
  if (session.accessToken) {
    headers.set('authorization', `Bearer ${session.accessToken}`);
  }
  headers.set('x-tenant-id', session.tenantId);
  headers.set('x-workspace-id', session.workspaceId);
  for (const name of ['accept', 'content-type', 'idempotency-key', 'traceparent', 'tracestate']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const init =
    request.method === 'GET' || request.method === 'HEAD'
      ? { headers, method: request.method }
      : { body: await request.text(), headers, method: request.method };

  let response: Response;
  try {
    response = await fetch(target, init);
  } catch {
    return NextResponse.json({ error: 'upstream_unavailable' }, { status: 502 });
  }

  return new NextResponse(response.body, {
    headers: response.headers,
    status: response.status,
  });
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await context.params).path);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await context.params).path);
}
