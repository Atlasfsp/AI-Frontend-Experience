import { NextResponse } from 'next/server';

import { createMockSession } from '@bac/auth';

import { appendSessionCookie, safeNextPath, sameOriginRedirect } from '@/lib/auth';
import { loadAppEnv } from '@/lib/env';

export async function POST(request: Request) {
  // Mock sessions carry no verified identity, so they exist only for local development.
  if (loadAppEnv().environment !== 'development') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  const formData = await request.formData();
  const nextPath = safeNextPath(formData.get('next')?.toString());
  const tenantId = formData.get('tenantId')?.toString().trim() || 'tenant-echo';
  const workspaceId = formData.get('workspaceId')?.toString().trim() || 'workspace-core';

  const response = sameOriginRedirect(nextPath);
  await appendSessionCookie(response, createMockSession({ tenantId, workspaceId }));

  return response;
}
