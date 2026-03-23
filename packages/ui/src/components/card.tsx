import { cn } from '../lib/cn';

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-[var(--bac-radius-lg)] border border-white/10 bg-white/5 p-6 shadow-[var(--bac-shadow-low)] backdrop-blur',
        className,
      )}
    >
      {children}
    </section>
  );
}
