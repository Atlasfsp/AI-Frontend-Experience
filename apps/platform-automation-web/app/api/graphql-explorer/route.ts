import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { hasPermission } from '@bac/auth';

import {
  executeMockGraphqlOperation,
  resolveGraphqlPermission,
} from '@/features/graphql-explorer';
import { readRequestSession } from '@/lib/auth';
import { loadAppEnv } from '@/lib/env';

const GraphqlRequestSchema = z.object({
  operationName: z.string().min(1).optional(),
  query: z.string().min(1),
  variables: z.unknown().optional(),
});

export async function POST(request: NextRequest) {
  const env = loadAppEnv();
  const session = await readRequestSession(request.cookies.get('bac_session')?.value);

  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const payload = GraphqlRequestSchema.parse(await request.json());
  const permission = resolveGraphqlPermission(payload.query);

  if (!hasPermission(session, permission)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const executionPayload = {
    query: payload.query,
    ...(payload.operationName ? { operationName: payload.operationName } : {}),
    ...(payload.variables !== undefined ? { variables: payload.variables } : {}),
  };

  if (env.enableMockApi) {
    return NextResponse.json(executeMockGraphqlOperation(executionPayload, session));
  }

  const response = await fetch(env.hasuraUrl, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${session.accessToken ?? 'mock-access-token'}`,
      'content-type': 'application/json',
      'x-tenant-id': session.tenantId,
      'x-workspace-id': session.workspaceId,
    },
    body: JSON.stringify(executionPayload),
  });

  const body = await response.text();

  return new NextResponse(body, {
    headers: {
      'content-type': response.headers.get('content-type') ?? 'application/json',
    },
    status: response.status,
  });
}
