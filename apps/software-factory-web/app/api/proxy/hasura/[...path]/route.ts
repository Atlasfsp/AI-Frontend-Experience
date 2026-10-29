import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { hasPermission } from '@bac/auth';

import { loadAppEnv } from '@/lib/env';
import { readRequestSession } from '@/lib/auth';
import { authorizeEngineeringProjectRead, queryReadsEngineeringProjects } from '@/lib/hasura-project-access';

function resolvePermission(method: string, path: string[]) {
  if (path[0] === 'subscriptions') {
    return 'data_access:subscribe';
  }

  if (method === 'GET') {
    return 'data_access:query';
  }

  return 'data_access:mutate';
}

async function proxy(request: NextRequest, path: string[]) {
  const env = loadAppEnv();
  const session = await readRequestSession(request.cookies.get('bac_session')?.value);

  if (!session || !hasPermission(session, resolvePermission(request.method, path))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  if (path.join('/') !== 'v1/graphql') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  let body: string | undefined;
  let graphQLQuery: string | null = null;
  if (request.method === 'GET') {
    graphQLQuery = request.nextUrl.searchParams.get('query');
    if (!graphQLQuery) {
      return NextResponse.json({ error: 'graphql_query_required' }, { status: 400 });
    }
  } else {
    const contentType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase();
    if (contentType !== 'application/json' && !contentType?.endsWith('+json')) {
      return NextResponse.json({ error: 'unsupported_graphql_content_type' }, { status: 415 });
    }
    body = await request.text();
    try {
      const parsed = JSON.parse(body) as { query?: unknown } | null;
      if (typeof parsed?.query !== 'string') {
        return NextResponse.json({ error: 'graphql_query_required' }, { status: 400 });
      }
      graphQLQuery = parsed.query;
    } catch {
      return NextResponse.json({ error: 'invalid_graphql_json' }, { status: 400 });
    }
  }
  if (queryReadsEngineeringProjects(graphQLQuery)) {
    const authorization = await authorizeEngineeringProjectRead(env.sdxApiUrl, session.accessToken);
    if (authorization === 'denied' || authorization === 'missing_token') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    if (authorization !== 'allowed') {
      return NextResponse.json({ error: 'authorization_unavailable' }, { status: 503 });
    }
  }

  const target = new URL(env.hasuraUrl);
  target.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  headers.set('authorization', `Bearer ${session.accessToken ?? 'mock-access-token'}`);
  headers.set('x-tenant-id', session.tenantId);
  headers.set('x-workspace-id', session.workspaceId);

  const init =
    request.method === 'GET' || request.method === 'HEAD'
      ? { headers, method: request.method }
      : { body: body ?? '', headers, method: request.method };

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
