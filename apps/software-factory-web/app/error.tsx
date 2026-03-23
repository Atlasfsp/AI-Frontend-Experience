'use client';

export default function Error({ error }: { error: Error & { digest?: string } }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="max-w-lg space-y-4 rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-rose-200/80">Unexpected failure</p>
        <h1 className="text-3xl font-semibold">The software factory shell hit an error.</h1>
        <p className="text-sm text-slate-300">{error.message}</p>
      </div>
    </div>
  );
}
