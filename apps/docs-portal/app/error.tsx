'use client';

import { ErrorState } from '@bac/ui';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <ErrorState
        title="The docs portal hit an unexpected error"
        description={error.message}
        actionLabel="Try again"
        onAction={reset}
      />
    </div>
  );
}
