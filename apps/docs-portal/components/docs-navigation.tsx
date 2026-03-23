'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@bac/ui';

import type { DocsSection } from '@/lib/docs-catalog';

export function DocsNavigation({ sections }: { sections: DocsSection[] }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-8" aria-label="Documentation navigation">
      {sections.map((section) => (
        <div key={section.title} className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/60">{section.title}</p>
            <p className="text-sm text-slate-400">{section.description}</p>
          </div>
          <div className="space-y-2">
            {section.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    'block rounded-[22px] border px-4 py-3 transition',
                    active
                      ? 'border-cyan-300/35 bg-cyan-300/10 text-white'
                      : 'border-white/5 bg-white/[0.03] text-slate-200 hover:border-white/10 hover:bg-white/[0.05]',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{item.title}</p>
                    <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      {item.readTime}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{item.summary}</p>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
