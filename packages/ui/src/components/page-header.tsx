export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-3">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-2">
          <h1 className="font-[var(--bac-font-display)] text-4xl font-semibold text-white">
            {title}
          </h1>
          <p className="max-w-3xl text-sm text-slate-300">{description}</p>
        </div>
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </header>
  );
}
