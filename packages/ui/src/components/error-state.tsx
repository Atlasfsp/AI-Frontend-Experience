import { Button } from './button';
import { Card } from './card';

export function ErrorState({
  actionLabel,
  description,
  onAction,
  title = 'Unable to load this surface',
}: {
  actionLabel?: string;
  description: string;
  onAction?: () => void;
  title?: string;
}) {
  return (
    <Card className="border-rose-300/25 bg-rose-500/10">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-100/75">
        Error
      </p>
      <h3 className="mt-3 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm text-slate-100/85">{description}</p>
      {actionLabel && onAction ? (
        <div className="mt-5">
          <Button onClick={onAction} variant="secondary">
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
