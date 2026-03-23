import { Card } from './card';

export function TerminalPanel({
  lines,
  title,
}: {
  lines: string[];
  title: string;
}) {
  return (
    <Card className="space-y-4 overflow-hidden border-emerald-300/20 bg-slate-950/88">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-rose-300" />
        <span className="h-3 w-3 rounded-full bg-amber-300" />
        <span className="h-3 w-3 rounded-full bg-emerald-300" />
        <p className="ml-3 text-xs uppercase tracking-[0.18em] text-emerald-100/70">
          {title}
        </p>
      </div>
      <pre className="overflow-x-auto rounded-[20px] border border-emerald-200/10 bg-[#03070d] p-5 text-xs text-emerald-100">
        <code>{lines.join('\n')}</code>
      </pre>
    </Card>
  );
}
