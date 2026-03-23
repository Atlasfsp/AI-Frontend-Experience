'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import { EmptyState } from './empty-state';

export interface CommandAction {
  description: string;
  href: string;
  keywords?: string[];
  label: string;
  section: string;
}

export function CommandPalette({
  actions,
  trigger,
}: {
  actions: CommandAction[];
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }

      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    } else {
      setQuery('');
    }
  }, [open]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return actions;
    }

    return actions.filter((action) =>
      [action.label, action.description, action.section, ...(action.keywords ?? [])]
        .join(' ')
        .toLowerCase()
        .includes(search),
    );
  }, [actions, query]);

  return (
    <>
      <button onClick={() => setOpen(true)} type="button">
        {trigger}
      </button>
      {open ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/70 p-4 backdrop-blur"
          role="dialog"
        >
          <div className="mx-auto max-w-3xl rounded-[30px] border border-white/10 bg-slate-950 p-5 shadow-2xl">
            <div className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-slate-950/80 px-4 py-3">
              <span className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100/70">
                Search
              </span>
              <input
                aria-label="Command palette search"
                className="flex-1 border-none bg-transparent text-base text-white outline-none placeholder:text-slate-500"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Jump to dashboard, swagger, incidents, releases..."
                ref={inputRef}
                value={query}
              />
              <button
                className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-300"
                onClick={() => setOpen(false)}
                type="button"
              >
                Esc
              </button>
            </div>
            <div className="mt-4 max-h-[60vh] overflow-y-auto">
              {filtered.length ? (
                <ul className="space-y-2">
                  {filtered.map((action) => (
                    <li key={`${action.section}-${action.href}`}>
                      <Link
                        className="block rounded-[22px] border border-white/5 bg-white/[0.03] px-4 py-4 transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
                        href={action.href}
                        onClick={() => setOpen(false)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-white">{action.label}</p>
                            <p className="mt-1 text-sm text-slate-300">{action.description}</p>
                          </div>
                          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            {action.section}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  description="Try a broader term like dashboard, policy, or contracts."
                  title="No matching commands"
                />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
