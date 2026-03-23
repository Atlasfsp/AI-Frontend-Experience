import { Button } from './button';
import { Card } from './card';

export function EmptyState({
  actionLabel,
  description,
  onAction,
  title,
}: {
  actionLabel?: string;
  description: string;
  onAction?: () => void;
  title: string;
}) {
  return (
    <Card className="border-dashed border-white/15 bg-white/[0.035] text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        Empty state
      </p>
      <h3 className="mt-4 text-xl font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300">{description}</p>
      {actionLabel && onAction ? (
        <div className="mt-6">
          <Button onClick={onAction} variant="secondary">
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
