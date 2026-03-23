import { Badge } from './badge';
import { Card } from './card';

export interface TimelineItem {
  actor?: string;
  description: string;
  status?: 'danger' | 'neutral' | 'success' | 'warning';
  time: string;
  title: string;
}

export function Timeline({
  items,
  title,
}: {
  items: TimelineItem[];
  title: string;
}) {
  return (
    <Card className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <Badge variant="neutral">{items.length} events</Badge>
      </div>
      <ol className="space-y-4">
        {items.map((item) => (
          <li key={`${item.time}-${item.title}`} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="mt-1 h-3 w-3 rounded-full bg-cyan-300" />
              <span className="mt-2 h-full w-px bg-white/10" />
            </div>
            <div className="flex-1 rounded-[22px] border border-white/10 bg-slate-950/35 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{item.title}</p>
                  {item.actor ? (
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                      {item.actor}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  {item.status ? <Badge variant={item.status}>{item.status}</Badge> : null}
                  <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    {item.time}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-300">{item.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
