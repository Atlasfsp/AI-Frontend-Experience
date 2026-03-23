import Link from 'next/link';

import { Card, DetailList, PageHeader } from '@bac/ui';

import { docsSections, featuredDocs } from '@/lib/docs-catalog';

export default function DocsHomePage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="BAC Docs"
        title="Product docs shell for operators and engineers"
        description="The docs portal is organized around product workflows, architecture context, API exploration, and day-two operating guidance for AI Frontend Experience."
      />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="grid gap-4 md:grid-cols-2">
          {featuredDocs.map((entry) => (
            <Link key={entry.id} href={entry.href}>
              <Card className="h-full space-y-4 transition hover:border-cyan-300/35 hover:bg-cyan-300/[0.08]">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    {entry.kind}
                  </span>
                  <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    {entry.readTime}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{entry.title}</h2>
                  <p className="mt-3 text-sm text-slate-300">{entry.summary}</p>
                </div>
                <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/65">
                  Owned by {entry.owner}
                </p>
              </Card>
            </Link>
          ))}
        </div>

        <DetailList
          items={[
            {
              label: 'Search coverage',
              value: 'Product routes, architecture notes, API surfaces, and runbook guidance all live in the catalog-backed index.',
            },
            {
              label: 'Operator posture',
              value: 'Every document is written for production use, with mock-mode notes kept explicit rather than hidden in placeholders.',
            },
            {
              label: 'Growth path',
              value: 'Add new documents by extending the catalog, then attach page content without rewriting shell navigation or search.',
            },
          ]}
          title="Why this portal scales"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {docsSections.map((section) => (
          <Card key={section.title} className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-white">{section.title}</h2>
              <p className="mt-2 text-sm text-slate-300">{section.description}</p>
            </div>
            <div className="space-y-3">
              {section.items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="block rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 transition hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-white">{item.title}</p>
                    <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      {item.readTime}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{item.summary}</p>
                </Link>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
