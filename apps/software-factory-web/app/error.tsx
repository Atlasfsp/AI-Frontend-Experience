'use client';

import { ErrorState } from '@bac/ui';

export default function Error({ error }: { error: Error & { digest?: string } }) {
  return (
    <div className="mx-auto max-w-3xl">
      <ErrorState
        title="The software factory shell hit an error"
        description={error.message}
      />
    </div>
  );
}
