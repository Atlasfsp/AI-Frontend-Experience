import { cn } from '../lib/cn';

export interface ChartDatum {
  annotation?: string;
  label: string;
  tone?: 'cyan' | 'emerald' | 'rose' | 'amber';
  value: number;
}

const toneMap = {
  amber: 'bg-amber-300',
  cyan: 'bg-cyan-300',
  emerald: 'bg-emerald-300',
  rose: 'bg-rose-300',
} as const;

export function MiniBarChart({ items }: { items: ChartDatum[] }) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-4" role="img" aria-label="Summary bar chart">
      {items.map((item) => (
        <div key={item.label} className="space-y-2">
          <div className="flex items-center justify-between gap-4 text-sm">
            <div>
              <p className="font-medium text-white">{item.label}</p>
              {item.annotation ? (
                <p className="text-xs text-slate-400">{item.annotation}</p>
              ) : null}
            </div>
            <span className="font-semibold text-slate-100">{item.value}</span>
          </div>
          <div className="h-2 rounded-full bg-white/8">
            <div
              className={cn(
                'h-2 rounded-full transition-all',
                toneMap[item.tone ?? 'cyan'],
              )}
              style={{ width: `${Math.max((item.value / maxValue) * 100, 8)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
