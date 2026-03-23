'use client';

import { useEffect, useState } from 'react';

import { Button } from './button';

export function Drawer({
  children,
  description,
  title,
  triggerLabel,
  triggerVariant = 'ghost',
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
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur">
          <button
            aria-label="Close drawer backdrop"
            className="flex-1"
            onClick={() => setOpen(false)}
            type="button"
          />
          <div
            aria-modal="true"
            className="h-full w-full max-w-2xl overflow-y-auto border-l border-white/10 bg-slate-950 p-6 shadow-2xl"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-white">{title}</h2>
                {description ? (
                  <p className="text-sm text-slate-300">{description}</p>
                ) : null}
              </div>
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white transition hover:bg-white/8"
                onClick={() => setOpen(false)}
                type="button"
              >
                <span className="sr-only">Close drawer</span>
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
