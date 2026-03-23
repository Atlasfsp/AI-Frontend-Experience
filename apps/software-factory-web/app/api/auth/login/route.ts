import { createOidcLoginResponse } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nextPath = searchParams.get('next') ?? '/software-factory';
  return createOidcLoginResponse(request, nextPath);
}
