import { LoadingState } from '@bac/ui';

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl">
      <LoadingState
        title="Loading software factory surface"
        description="Preparing the next delivery workspace panel, build signals, and navigation context."
      />
    </div>
  );
}
