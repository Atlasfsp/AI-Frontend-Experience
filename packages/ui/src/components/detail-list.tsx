import { Card } from './card';
import { cn } from '../lib/cn';

export interface DetailItem {
  hint?: string;
  label: string;
  monospace?: boolean;
  value: React.ReactNode;
}

export function DetailList({
  description,
  items,
  title,
}: {
  description?: string;
  items: DetailItem[];
  title: string;
}) {
  return (
    <Card className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {description ? <p className="text-sm text-slate-300">{description}</p> : null}
      </div>
      <dl className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-[20px] border border-white/10 bg-slate-950/40 p-4"
          >
            <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">
              {item.label}
            </dt>
            <dd
              className={cn(
                'mt-2 text-base font-semibold text-white',
                item.monospace && 'font-mono text-sm',
              )}
            >
              {item.value}
            </dd>
            {item.hint ? <p className="mt-2 text-sm text-slate-400">{item.hint}</p> : null}
          </div>
        ))}
      </dl>
    </Card>
  );
}
