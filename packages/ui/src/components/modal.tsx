'use client';

import { useEffect, useState } from 'react';

import { cn } from '../lib/cn';
import { Button } from './button';

export function Modal({
  children,
  description,
  title,
  triggerLabel,
  triggerVariant = 'secondary',
}: {
  children: React.ReactNode;
  description?: string;
  title: string;
  triggerLabel: string;
  triggerVariant?: 'ghost' | 'primary' | 'secondary';
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <>
      <Button onClick={() => setOpen(true)} variant={triggerVariant}>
        {triggerLabel}
      </Button>
      {open ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur"
          role="dialog"
        >
          <div className="w-full max-w-3xl rounded-[28px] border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-white">{title}</h2>
                {description ? (
                  <p className="text-sm text-slate-300">{description}</p>
                ) : null}
              </div>
              <button
                className={cn(
                  'inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white transition hover:bg-white/8',
                )}
                onClick={() => setOpen(false)}
                type="button"
              >
                <span className="sr-only">Close modal</span>
                ×
              </button>
            </div>
            <div className="mt-6">{children}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
