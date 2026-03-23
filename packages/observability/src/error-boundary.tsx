'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

import { createLogger } from './logger';
import { captureException } from './sentry';

const logger = createLogger({ app: 'observability-error-boundary' });

export class BacErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  override state = { hasError: false };

  override componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error('ui.error_boundary_triggered', {
      componentStack: info.componentStack,
      errorMessage: error.message,
    });

    captureException(error, {
      componentStack: info.componentStack,
    });
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-[var(--bac-radius-lg)] border border-rose-300/20 bg-rose-500/10 p-6 text-sm text-rose-100">
            Something went wrong while loading this operational surface.
          </div>
        )
      );
    }

    return this.props.children;
  }
}
