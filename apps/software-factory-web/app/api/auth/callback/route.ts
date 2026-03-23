import type { NextRequest } from 'next/server';

import { createOidcCallbackResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
  return createOidcCallbackResponse(request);
}
