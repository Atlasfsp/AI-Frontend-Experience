import Link from 'next/link';

import { EmptyState } from '@bac/ui';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <EmptyState
        title="That document was not found"
        description="The docs catalog does not have a page for this route yet. Head back to the portal home or search for a nearby topic."
      />
      <Link
        href="/"
        className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
      >
        Return to docs home
      </Link>
    </div>
  );
}
