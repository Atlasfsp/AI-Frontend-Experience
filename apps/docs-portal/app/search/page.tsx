'use client';

import { useSearchParams } from 'next/navigation';

import { PageHeader } from '@bac/ui';

import { DocsSearchPanel } from '@/components/docs-search-panel';
import { docsIndex } from '@/lib/docs-catalog';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Search"
        title="Documentation search"
        description="Search across product docs, architecture notes, API surfaces, and runbooks from a single catalog-backed index."
      />
      <DocsSearchPanel entries={docsIndex} initialQuery={initialQuery} />
    </div>
  );
}
