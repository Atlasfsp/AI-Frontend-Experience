import * as Sentry from '@sentry/nextjs';

export interface SentryConfig {
  dsn: string;
  environment: string;
  app: string;
  release?: string;
}

export function initSentry(config: SentryConfig): void {
  const initOptions: {
    dsn: string;
    environment: string;
    release?: string;
    tracesSampleRate: number;
    replaysSessionSampleRate: number;
    replaysOnErrorSampleRate: number;
    initialScope: {
      tags: {
        app: string;
      };
    };
  } = {
    dsn: config.dsn,
    environment: config.environment,
    tracesSampleRate: config.environment === 'production' ? 0.2 : 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: config.environment === 'production' ? 1.0 : 0,
    initialScope: {
      tags: {
        app: config.app,
      },
    },
  };

  if (config.release) {
    initOptions.release = config.release;
  }

  Sentry.init(initOptions);
}

export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (context) {
    Sentry.captureException(error, {
      extra: context,
    });
    return;
  }

  Sentry.captureException(error);
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
  const breadcrumb: Sentry.Breadcrumb = {
    category,
    message,
    level: 'info',
  };

  if (data) {
    breadcrumb.data = data;
  }

  Sentry.addBreadcrumb(breadcrumb);
}

export async function withSentrySpan<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  return Sentry.startSpan({ name, op: 'function' }, async () => {
    return fn();
  });
}
