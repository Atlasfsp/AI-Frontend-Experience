import { NextResponse } from 'next/server';

import { loadAppEnv } from '@/lib/env';

export async function GET() {
  const env = loadAppEnv();

  return NextResponse.json({
    environment: env.environment,
    service: 'software-factory-web',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
