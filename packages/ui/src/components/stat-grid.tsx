import { Badge } from './badge';
import { Card } from './card';

export interface StatItem {
  description: string;
  label: string;
  status?: 'danger' | 'neutral' | 'success' | 'warning';
  value: string;
}

export function StatGrid({ items }: { items: StatItem[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
            {item.status ? <Badge variant={item.status}>{item.status}</Badge> : null}
          </div>
          <p className="text-3xl font-semibold text-white">{item.value}</p>
          <p className="text-sm text-slate-300">{item.description}</p>
        </Card>
      ))}
    </div>
  );
}
