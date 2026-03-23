import { cookies } from 'next/headers';

import { sessionCookieName } from '@bac/auth';

import { readRequestSession } from './auth';

export async function getServerSession() {
  const cookieStore = await cookies();
  return readRequestSession(cookieStore.get(sessionCookieName)?.value);
}
