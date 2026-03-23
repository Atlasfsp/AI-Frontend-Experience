export { BacErrorBoundary } from './error-boundary';
export { createLogger } from './logger';
export type { LogContext } from './logger';
export { recordMetric } from './metrics';
export {
  addBreadcrumb,
  captureException,
  captureMessage,
  initSentry,
  setUser,
  withSentrySpan,
} from './sentry';
export type { SentryConfig } from './sentry';
export { withSpan } from './tracing';
