import { NextResponse } from 'next/server';

const startTime = Date.now();

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: process.env.APP_VERSION ?? '0.0.0-local',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    app: 'software-factory-web',
  });
}
