'use client';

import * as Sentry from '@sentry/nextjs';

export function captureReactException(
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
