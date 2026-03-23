import { Card } from './card';

export function LoadingState({
  description = 'We are preparing the next panel.',
  title = 'Loading surface',
}: {
  description?: string;
  title?: string;
}) {
  return (
    <Card className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          Loading
        </p>
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <p className="text-sm text-slate-300">{description}</p>
      </div>
      <div className="space-y-3">
        <div className="h-3 animate-pulse rounded-full bg-white/10" />
        <div className="h-3 w-11/12 animate-pulse rounded-full bg-white/10" />
        <div className="h-3 w-3/4 animate-pulse rounded-full bg-white/10" />
      </div>
    </Card>
  );
}
