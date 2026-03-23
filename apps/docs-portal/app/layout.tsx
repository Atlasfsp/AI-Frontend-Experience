import './globals.css';

import Link from 'next/link';
import type { Metadata } from 'next';

import { createCssVariableBlock, tokenSets } from '@bac/design-tokens';
import { Badge, CommandPalette } from '@bac/ui';

import { DocsNavigation } from '@/components/docs-navigation';
import { docsIndex, docsSections } from '@/lib/docs-catalog';

export const metadata: Metadata = {
  title: 'BAC Docs Portal',
  description:
    'Product docs, architecture notes, runbooks, and API references for AI Frontend Experience.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const tokenStyles = [createCssVariableBlock(tokenSets.enterprise), createCssVariableBlock(tokenSets.consumer)].join('\n');
  const commandActions = docsIndex.map((entry) => ({
    description: entry.summary,
    href: entry.href,
    keywords: [...entry.keywords, ...entry.audience],
    label: entry.title,
    section: entry.section,
  }));

  return (
    <html lang="en" data-bac-theme="enterprise">
      <body>
        <style dangerouslySetInnerHTML={{ __html: tokenStyles }} />
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(21,184,166,0.16),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.14),_transparent_26%),linear-gradient(180deg,_#071019,_#03060d_82%)] text-white">
          <div className="mx-auto grid min-h-screen max-w-[1680px] lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="border-r border-white/10 bg-slate-950/60 px-6 py-8 backdrop-blur">
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/60">BAC Docs</p>
                  <Link href="/" className="mt-2 block font-[var(--bac-font-display)] text-2xl font-semibold text-white">
                    AI Frontend Experience
                  </Link>
                  <p className="mt-3 text-sm text-slate-400">
                    Search-ready operator documentation for the web experience layer.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="success">Search-ready</Badge>
                  <Badge variant="neutral">Version 0.1</Badge>
                </div>
              </div>
              <div className="mt-8">
                <DocsNavigation sections={docsSections} />
              </div>
              <div className="mt-10 rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/65">Need help?</p>
                <p className="mt-3 text-sm text-slate-300">
                  Start with the help center, then escalate with route, tenant, workspace, and failing command context.
                </p>
                <Link
                  href="/help"
                  className="mt-5 inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Open help center
                </Link>
              </div>
            </aside>
            <div className="flex min-h-screen flex-col">
              <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/55 px-6 py-4 backdrop-blur">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <form action="/search" className="flex w-full max-w-2xl items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                    <label htmlFor="docs-search" className="sr-only">
                      Search docs
                    </label>
                    <input
                      id="docs-search"
                      name="q"
                      className="h-10 flex-1 border-none bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                      placeholder="Search docs, APIs, runbooks, and product guides"
                      type="search"
                    />
                    <button
                      className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10"
                      type="submit"
                    >
                      Search
                    </button>
                  </form>
                  <div className="flex flex-wrap items-center gap-3">
                    <CommandPalette
                      actions={commandActions}
                      trigger={
                        <span className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-slate-100 transition hover:bg-white/10">
                          Open docs palette
                          <span className="ml-3 rounded-full border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                            Cmd/Ctrl K
                          </span>
                        </span>
                      }
                    />
                    <Link
                      href="/api-reference"
                      className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                    >
                      API reference
                    </Link>
                  </div>
                </div>
              </header>
              <main className="flex-1 px-6 py-8 lg:px-8">{children}</main>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
