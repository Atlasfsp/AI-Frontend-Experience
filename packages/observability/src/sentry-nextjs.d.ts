declare module '@sentry/nextjs' {
  export type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

  export interface Breadcrumb {
    category?: string;
    message?: string;
    data?: Record<string, unknown>;
    level?: SeverityLevel;
  }

  export interface SpanOptions {
    name: string;
    op: string;
  }

  export function init(options: {
    dsn: string;
    environment: string;
    release?: string;
    tracesSampleRate?: number;
    replaysSessionSampleRate?: number;
    replaysOnErrorSampleRate?: number;
    initialScope?: {
      tags?: Record<string, string>;
    };
  }): void;

  export function captureException(error: unknown, context?: { extra?: Record<string, unknown> }): void;
  export function captureMessage(message: string, level?: SeverityLevel): void;
  export function setUser(user: { id?: string; email?: string; tenant_id?: string } | null): void;
  export function addBreadcrumb(breadcrumb: Breadcrumb): void;
  export function startSpan<T>(options: SpanOptions, callback: () => Promise<T>): Promise<T>;
}
