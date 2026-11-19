export class FluxCoreApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly reason?: string,
  ) {
    super(message);
    this.name = 'FluxCoreApiError';
  }
}

export type ApiResult<T> = { data: T; replayed: boolean };

const statusMessages: Record<number, string> = {
  401: 'Your sign-in has expired. Sign in again; nothing was saved.',
  403: 'Your account is not permitted to perform this action in this tenant.',
  404: 'The project or record was not found in your tenant.',
  408: 'The request timed out before anything was saved. Retry to continue.',
  409: 'The project changed or this decision is already final. The workspace was reloaded; review and retry.',
  413: 'The request is too large.',
  422: 'The request could not be applied to this project.',
  502: 'The FluxCore API is unreachable. Nothing was saved.',
  503: 'Project persistence is not connected. Nothing was saved.',
};

export function describeFailure(error: unknown) {
  if (error instanceof FluxCoreApiError) {
    const detail = error.message && error.message !== statusMessages[error.status] ? ` (${error.message}${error.reason ? `: ${error.reason}` : ''})` : '';
    return `${statusMessages[error.status] ?? `The FluxCore API returned ${error.status}.`}${detail}`;
  }
  return 'The FluxCore API could not be reached. Nothing was confirmed as saved.';
}

function newKey() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}-key`;
}

/**
 * Mutations reuse one Idempotency-Key per logical request until the backend
 * gives a definitive answer, so a retry after a dropped connection or a 5xx
 * replays the original write instead of creating a second one.
 */
export class IdempotencyKeys {
  private readonly keys = new Map<string, string>();

  keyFor(signature: string) {
    let key = this.keys.get(signature);
    if (!key) {
      key = newKey();
      this.keys.set(signature, key);
    }
    return key;
  }

  settle(signature: string, status: number | null) {
    if (status !== null && status < 500 && status !== 408) this.keys.delete(signature);
  }
}

export async function callFluxCore<T>(
  method: 'GET' | 'POST' | 'PUT',
  path: string,
  options: { body?: unknown; keys?: IdempotencyKeys; fetcher?: typeof fetch } = {},
): Promise<ApiResult<T>> {
  const fetcher = options.fetcher ?? fetch;
  const headers: Record<string, string> = { accept: 'application/json' };
  let body: string | undefined;
  let signature = '';
  if (options.body !== undefined) {
    body = JSON.stringify(options.body);
    headers['content-type'] = 'application/json';
  }
  if (method !== 'GET' && options.keys) {
    signature = `${method} ${path} ${body ?? ''}`;
    headers['Idempotency-Key'] = options.keys.keyFor(signature);
  }
  let response: Response;
  try {
    response = await fetcher(`/api/proxy/sdx/${path}`, { method, headers, cache: 'no-store', ...(body === undefined ? {} : { body }) });
  } catch (error) {
    options.keys?.settle(signature, null);
    throw error;
  }
  options.keys?.settle(signature, response.status);
  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok) {
    throw new FluxCoreApiError(
      response.status,
      typeof payload?.error === 'string' ? payload.error : statusMessages[response.status] ?? `HTTP ${response.status}`,
      typeof payload?.reason === 'string' ? payload.reason : undefined,
    );
  }
  if (!payload || typeof payload !== 'object') {
    throw new FluxCoreApiError(response.status, 'The FluxCore API returned an unreadable response.');
  }
  return { data: payload as T, replayed: response.headers.get('idempotent-replay') === 'true' };
}
