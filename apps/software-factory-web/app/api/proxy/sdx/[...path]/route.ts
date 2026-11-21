import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { hasPermission, sessionCookieName } from '@bac/auth';

import { resolveSdxPermission } from '@/lib/sdx-permissions';
import { loadAppEnv } from '@/lib/env';
import { readRequestSession } from '@/lib/auth';

const maxBodyBytes = 64 * 1024;
const upstreamTimeoutMs = 15_000;
const forwardedRequestHeaders = ['accept', 'content-type', 'idempotency-key', 'traceparent', 'tracestate'];
const forwardedResponseHeaders = ['content-type', 'idempotent-replay', 'cache-control', 'retry-after', 'traceparent'];

function deny(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

/**
 * The FluxCore API makes the final tenant decision, but a browser-supplied
 * tenant_id that differs from the signed session is refused here so a forged
 * scope never reaches the backend with this session's credentials.
 */
function tenantMismatch(values: unknown[], tenantId: string) {
  return values.some((value) => value !== undefined && value !== tenantId);
}

type BodyRead = { status: 'ok'; text: string } | { status: 'too_large' } | { status: 'invalid' };

/** Reads at most maxBodyBytes from the request stream and cancels it as soon as the limit is exceeded. */
async function readBoundedBody(request: NextRequest): Promise<BodyRead> {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBodyBytes) {
    await request.body?.cancel().catch(() => undefined);
    return { status: 'too_large' };
  }
  if (!request.body) return { status: 'ok', text: '' };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBodyBytes) {
      await reader.cancel().catch(() => undefined);
      return { status: 'too_large' };
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { status: 'ok', text: new TextDecoder('utf-8', { fatal: true }).decode(bytes) };
  } catch {
    return { status: 'invalid' };
  }
}

async function proxy(request: NextRequest, path: string[]) {
  const env = loadAppEnv();
  const session = await readRequestSession(request.cookies.get(sessionCookieName)?.value);
  const permission = resolveSdxPermission(request.method, path);

  if (!permission) return deny(404, 'not_found');
  if (!session || !hasPermission(session, permission)) return deny(403, 'forbidden');
  if (session.authMode === 'mock' && env.environment !== 'development') return deny(403, 'forbidden');

  if (tenantMismatch(request.nextUrl.searchParams.getAll('tenant_id'), session.tenantId)) {
    return deny(403, 'tenant_mismatch');
  }

  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const read = await readBoundedBody(request);
    if (read.status === 'too_large') return deny(413, 'payload_too_large');
    if (read.status === 'invalid') return deny(400, 'invalid_json');
    body = read.text;
    if (body.trim()) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(body);
      } catch {
        return deny(400, 'invalid_json');
      }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return deny(400, 'invalid_json');
      if (tenantMismatch([(parsed as Record<string, unknown>).tenant_id], session.tenantId)) {
        return deny(403, 'tenant_mismatch');
      }
    }
  }

  const target = new URL(path.join('/'), `${env.sdxApiUrl.replace(/\/$/, '')}/`);
  target.search = request.nextUrl.search;

  const headers = new Headers();
  if (session.accessToken) {
    headers.set('authorization', `Bearer ${session.accessToken}`);
  }
  headers.set('x-tenant-id', session.tenantId);
  headers.set('x-fluxcore-tenant-id', session.tenantId);
  headers.set('x-workspace-id', session.workspaceId);
  for (const name of forwardedRequestHeaders) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const init: RequestInit =
    body === undefined
      ? { cache: 'no-store', headers, method: request.method }
      : { body, cache: 'no-store', headers, method: request.method };

  // One deadline covers the headers and the whole body: a stalled body after
  // 2xx headers must still fail, or the browser waits forever with its write pending.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), upstreamTimeoutMs);
  const release = () => clearTimeout(timer);
  let response: Response;
  try {
    response = await fetch(target, { ...init, redirect: 'manual', signal: controller.signal });
  } catch {
    release();
    // A mutation may have been committed before the connection failed or timed out.
    return controller.signal.aborted ? deny(504, 'upstream_timeout_outcome_unconfirmed') : deny(502, 'upstream_unavailable');
  }

  // Redirects are never followed or reflected: following would replay the bearer token
  // to another origin, and reflecting Location or Set-Cookie would leak upstream state.
  if (response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)) {
    release();
    await response.body?.cancel().catch(() => undefined);
    return deny(502, 'upstream_redirect_refused');
  }

  const responseHeaders = new Headers();
  for (const name of forwardedResponseHeaders) {
    const value = response.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  if (!response.body) {
    release();
    return new NextResponse(null, { headers: responseHeaders, status: response.status });
  }
  return new NextResponse(forwardWithinDeadline(response.body, controller.signal, release), {
    headers: responseHeaders,
    status: response.status,
  });
}

/**
 * Streams the upstream body without buffering it. If the deadline expires or
 * the upstream connection fails mid-body, the forwarded stream is errored
 * rather than closed, so a truncated body can never parse as a complete
 * response; the browser then reaches its unconfirmed-outcome recovery path.
 */
function forwardWithinDeadline(body: ReadableStream<Uint8Array>, signal: AbortSignal, release: () => void) {
  const reader = body.getReader();
  let settled = false;
  let onAbort = () => {};
  const finish = () => {
    if (settled) return false;
    settled = true;
    release();
    signal.removeEventListener('abort', onAbort);
    return true;
  };
  return new ReadableStream<Uint8Array>(
    {
      start(stream) {
        onAbort = () => {
          if (!finish()) return;
          stream.error(new DOMException('upstream_timeout_outcome_unconfirmed', 'TimeoutError'));
          reader.cancel().catch(() => undefined);
        };
        if (signal.aborted) onAbort();
        else signal.addEventListener('abort', onAbort, { once: true });
      },
      async pull(stream) {
        try {
          const { done, value } = await reader.read();
          if (settled) return;
          if (done) {
            finish();
            stream.close();
          } else {
            stream.enqueue(value);
          }
        } catch (error) {
          if (!finish()) return;
          stream.error(error);
        }
      },
      cancel(reason) {
        finish();
        return reader.cancel(reason).catch(() => undefined);
      },
    },
    { highWaterMark: 0 },
  );
}

type ProxyContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: ProxyContext) {
  return proxy(request, (await context.params).path);
}

export async function POST(request: NextRequest, context: ProxyContext) {
  return proxy(request, (await context.params).path);
}

export async function PUT(request: NextRequest, context: ProxyContext) {
  return proxy(request, (await context.params).path);
}
