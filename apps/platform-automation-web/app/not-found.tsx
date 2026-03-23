export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="max-w-lg space-y-4 rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">404</p>
        <h1 className="text-3xl font-semibold">That view does not exist in the platform automation shell.</h1>
      </div>
    </div>
  );
}
