import * as Sentry from '@sentry/nextjs';

export interface SentryConfig {
  dsn: string;
  environment: string;
  app: string;
  release?: string;
}

export function initSentry(config: SentryConfig): void {
  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,
    tracesSampleRate: config.environment === 'production' ? 0.2 : 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: config.environment === 'production' ? 1.0 : 0,
    initialScope: {
      tags: {
        app: config.app,
      },
    },
  });
}

export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  Sentry.captureException(error, {
    extra: context,
  });
}

export function captureMessage(
  message: string,
  level?: 'info' | 'warning' | 'error',
): void {
  Sentry.captureMessage(message, level ?? 'info');
}

export function setUser(user: {
  id: string;
  email: string;
  tenantId: string;
}): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    tenant_id: user.tenantId,
  });
}

export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>,
): void {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: 'info',
  });
}

export async function withSentrySpan<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  return Sentry.startSpan({ name, op: 'function' }, async () => {
    return fn();
  });
}
