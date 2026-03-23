'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { EmptyState, cn } from '@bac/ui';

import type { DocEntry } from '@/lib/docs-catalog';

export function DocsSearchPanel({
  entries,
  initialQuery = '',
}: {
  entries: DocEntry[];
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);

  const filteredEntries = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return entries;
    }

    return entries.filter((entry) =>
      [entry.title, entry.summary, entry.kind, entry.owner, ...entry.keywords, ...entry.audience]
        .join(' ')
        .toLowerCase()
        .includes(search),
    );
  }, [entries, query]);

  return (
    <div className="space-y-6">
      <label className="block space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100/65">
          Search docs
        </span>
        <input
          aria-label="Search documentation"
          className="h-12 w-full rounded-[22px] border border-white/10 bg-slate-950/75 px-4 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/40"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by product, route, contract, workflow, or owner"
          value={query}
        />
      </label>
      <p className="text-sm text-slate-400">
        {filteredEntries.length} result{filteredEntries.length === 1 ? '' : 's'}
        {query ? ` for “${query}”` : ' across the docs portal'}
      </p>
      {filteredEntries.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredEntries.map((entry) => (
            <Link
              key={entry.id}
              href={entry.href}
              className={cn(
                'rounded-[28px] border border-white/10 bg-white/[0.04] p-5 transition',
                'hover:border-cyan-300/30 hover:bg-cyan-300/[0.08]',
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-lg font-semibold text-white">{entry.title}</p>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  {entry.kind}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-300">{entry.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                <span>{entry.section}</span>
                <span>{entry.owner}</span>
                <span>{entry.readTime}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No matching documents"
          description="Try a broader term such as swagger, releases, observability, clusters, or runbooks."
        />
      )}
    </div>
  );
}
