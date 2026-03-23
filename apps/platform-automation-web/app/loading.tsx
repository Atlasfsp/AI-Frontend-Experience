import { LoadingState } from '@bac/ui';

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl">
      <LoadingState
        title="Loading platform surface"
        description="Preparing the next control-plane panel, operational signals, and policy-aware navigation state."
      />
    </div>
  );
}
