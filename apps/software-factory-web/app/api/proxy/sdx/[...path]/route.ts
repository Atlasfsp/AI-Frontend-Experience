import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { hasPermission } from '@bac/auth';

import { loadAppEnv } from '@/lib/env';
import { readRequestSession } from '@/lib/auth';

function resolvePermission(method: string) {
  return method === 'GET' ? 'application:view' : 'application:deploy';
}

async function proxy(request: NextRequest, path: string[]) {
  const env = loadAppEnv();
  const session = await readRequestSession(request.cookies.get('bac_session')?.value);

  if (!session || !hasPermission(session, resolvePermission(request.method))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const target = new URL(path.join('/'), `${env.sdxApiUrl.replace(/\/$/, '')}/`);
  target.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  headers.set('authorization', `Bearer ${session.accessToken ?? 'mock-access-token'}`);
  headers.set('x-tenant-id', session.tenantId);
  headers.set('x-workspace-id', session.workspaceId);

  const init =
    request.method === 'GET' || request.method === 'HEAD'
      ? { headers, method: request.method }
      : { body: await request.text(), headers, method: request.method };

  const response = await fetch(target, init);

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

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await context.params).path);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await context.params).path);
}
