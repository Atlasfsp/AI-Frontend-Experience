import { LoadingState } from '@bac/ui';

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl">
      <LoadingState
        title="Loading docs surface"
        description="Fetching the next section of the docs portal and preparing its navigation context."
      />
    </div>
  );
}
