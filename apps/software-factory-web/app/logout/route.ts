import { clearAuthCookies, sameOriginRedirect } from '@/lib/auth';

export async function GET() {
  const response = sameOriginRedirect('/login');
  clearAuthCookies(response);
  return response;
}
