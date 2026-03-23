import { NextResponse } from 'next/server';

import { createMockSession } from '@bac/auth';

import { appendSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  const formData = await request.formData();
  const nextPath = formData.get('next')?.toString() ?? '/software-factory';
  const tenantId = formData.get('tenantId')?.toString() ?? 'tenant-echo';
  const workspaceId = formData.get('workspaceId')?.toString() ?? 'workspace-core';

  const response = NextResponse.redirect(new URL(nextPath, request.url));
  await appendSessionCookie(response, createMockSession({ tenantId, workspaceId }));

  return response;
}
