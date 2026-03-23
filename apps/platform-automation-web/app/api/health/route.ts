import { NextResponse } from 'next/server';

import { loadAppEnv } from '@/lib/env';

export async function GET() {
  const env = loadAppEnv();

  return NextResponse.json({
    environment: env.environment,
    service: 'platform-automation-web',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
