import { cn } from '../lib/cn';

const variantMap = {
  danger: 'bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/40',
  neutral: 'bg-white/10 text-slate-100 ring-1 ring-white/10',
  success: 'bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-400/40',
  warning: 'bg-amber-400/15 text-amber-100 ring-1 ring-amber-300/40',
} as const;

export function Badge({
  children,
  className,
  variant = 'neutral',
}: {
  children: React.ReactNode;
  className?: string;
  variant?: keyof typeof variantMap;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]',
        variantMap[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
