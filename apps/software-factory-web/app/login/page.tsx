export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const nextPath = typeof resolvedSearchParams.next === 'string' ? resolvedSearchParams.next : '/software-factory';

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(31,94,255,0.28),_transparent_32%),linear-gradient(180deg,_#06111f,_#050910)] px-6">
      <div className="w-full max-w-md space-y-6 rounded-[28px] border border-white/10 bg-white/5 p-8 text-white shadow-[var(--bac-shadow-medium)] backdrop-blur">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/75">Authentik scaffold</p>
          <h1 className="font-[var(--bac-font-display)] text-4xl font-semibold">Sign in to BAC SDX</h1>
          <p className="text-sm text-slate-300">
            The web shell supports both a production OIDC redirect and a secure mock path for local workspace
            development. All authenticated browser traffic is expected to flow through the BFF proxy routes.
          </p>
        </div>
        <a
          className="inline-flex h-12 w-full items-center justify-center rounded-full border border-cyan-200/35 bg-cyan-400/10 px-4 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-400/15"
          href={`/api/auth/login?next=${encodeURIComponent(nextPath)}`}
        >
          Continue with Authentik OIDC
        </a>
        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.26em] text-slate-500">
          <span className="h-px flex-1 bg-white/10" />
          Local operator mode
          <span className="h-px flex-1 bg-white/10" />
        </div>
        <form action="/api/auth/mock-login" className="space-y-4" method="post">
          <input name="next" type="hidden" value={nextPath} />
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200" htmlFor="tenantId">
              Tenant ID
            </label>
            <input
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-white outline-none ring-0 placeholder:text-slate-500"
              defaultValue="tenant-echo"
              id="tenantId"
              name="tenantId"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200" htmlFor="workspaceId">
              Workspace ID
            </label>
            <input
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-white outline-none ring-0 placeholder:text-slate-500"
              defaultValue="workspace-core"
              id="workspaceId"
              name="workspaceId"
            />
          </div>
          <button
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--bac-color-primary)] px-4 text-sm font-semibold text-white transition hover:opacity-90"
            type="submit"
          >
            Continue with mock session
          </button>
        </form>
      </div>
    </main>
  );
}
