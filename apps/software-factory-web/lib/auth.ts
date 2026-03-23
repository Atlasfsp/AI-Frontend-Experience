import { NextResponse, type NextRequest } from 'next/server';

import {
  buildAuthorizationUrl,
  claimsToSession,
  createMockSession,
  createSignedSessionToken,
  exchangeAuthorizationCode,
  parseJwtClaims,
  sessionCookieName,
  verifySignedSessionToken,
} from '@bac/auth';

import { loadAppEnv } from './env';

export const authStateCookieName = 'bac_auth_state';
export const authVerifierCookieName = 'bac_auth_code_verifier';
export const authNextCookieName = 'bac_auth_next';

function isSecureCookie() {
  return loadAppEnv().environment === 'production';
}

export async function readRequestSession(token: string | undefined) {
  return verifySignedSessionToken(token, loadAppEnv().sessionSecret);
}

export async function appendSessionCookie(response: NextResponse, session = createMockSession()) {
  response.cookies.set({
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    name: sessionCookieName,
    path: '/',
    sameSite: 'lax',
    secure: isSecureCookie(),
    value: await createSignedSessionToken(session, loadAppEnv().sessionSecret),
  });
}

export function clearAuthCookies(response: NextResponse) {
  [sessionCookieName, authStateCookieName, authVerifierCookieName, authNextCookieName].forEach((name) => {
    response.cookies.set({
      expires: new Date(0),
      name,
      path: '/',
      value: '',
    });
  });
}

export async function createOidcLoginResponse(request: Request, nextPath: string) {
  const env = loadAppEnv();
  const { codeVerifier, state, url } = await buildAuthorizationUrl({
    authorizationUrl: env.authAuthorizeUrl,
    clientId: env.authClientId,
    redirectUri: env.authCallbackUrl,
  });

  const response = NextResponse.redirect(url);
  response.cookies.set({
    httpOnly: true,
    maxAge: 60 * 10,
    name: authStateCookieName,
    path: '/',
    sameSite: 'lax',
    secure: isSecureCookie(),
    value: state,
  });
  response.cookies.set({
    httpOnly: true,
    maxAge: 60 * 10,
    name: authVerifierCookieName,
    path: '/',
    sameSite: 'lax',
    secure: isSecureCookie(),
    value: codeVerifier,
  });
  response.cookies.set({
    httpOnly: true,
    maxAge: 60 * 10,
    name: authNextCookieName,
    path: '/',
    sameSite: 'lax',
    secure: isSecureCookie(),
    value: nextPath,
  });

  return response;
}

export async function createOidcCallbackResponse(request: NextRequest, fallbackPath = '/software-factory') {
  const env = loadAppEnv();
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const stateCookie = request.cookies.get(authStateCookieName)?.value;
  const codeVerifier = request.cookies.get(authVerifierCookieName)?.value;
  const nextPath = request.cookies.get(authNextCookieName)?.value ?? fallbackPath;

  if (!code || !state || !stateCookie || state !== stateCookie || !codeVerifier) {
    return NextResponse.redirect(new URL(`/login?error=oidc_state&next=${encodeURIComponent(nextPath)}`, request.url));
  }

  const tokenResponse = await exchangeAuthorizationCode({
    clientId: env.authClientId,
    code,
    codeVerifier,
    redirectUri: env.authCallbackUrl,
    tokenUrl: env.authTokenUrl,
    ...(env.authClientSecret ? { clientSecret: env.authClientSecret } : {}),
  });

  const claims = parseJwtClaims(tokenResponse.id_token ?? tokenResponse.access_token);
  const session = claimsToSession(claims, {
    accessToken: tokenResponse.access_token,
    idToken: tokenResponse.id_token,
    refreshToken: tokenResponse.refresh_token,
    scope: tokenResponse.scope?.split(' '),
  });

  const response = NextResponse.redirect(new URL(nextPath, request.url));
  clearAuthCookies(response);
  await appendSessionCookie(response, session);
  return response;
}
