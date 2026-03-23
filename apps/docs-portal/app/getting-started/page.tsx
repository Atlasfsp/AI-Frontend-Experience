import { Card, DetailList, DocsCodePanel, PageHeader } from '@bac/ui';

export default function GettingStartedPage() {
  const envTemplate = `BAC_AUTH_MODE=mock
BAC_ENABLE_MOCK_API=true
BAC_AUTHENTIK_ISSUER=https://auth.example.com/application/o/ai-frontend/
BAC_AUTHENTIK_CLIENT_ID=web-client
BAC_AUTHENTIK_REDIRECT_URI=http://localhost:3000/api/auth/callback
BAC_SWAGGER_URL=http://localhost:8080/openapi.json
BAC_HASURA_URL=http://localhost:8081/v1/graphql`;

  const validationCommands = `pnpm install --no-frozen-lockfile
pnpm dev:software-factory
pnpm dev:platform
pnpm dev:docs
pnpm check`;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="BAC Docs"
        title="Getting started"
        description="Local setup, environment defaults, and the shortest path to a working operator shell on day one."
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-4">
          <h2 className="text-xl font-semibold text-white">First session checklist</h2>
          <ol className="space-y-3 pl-5 text-sm text-slate-300">
            <li>Install dependencies with `pnpm install --no-frozen-lockfile` at the repo root.</li>
            <li>Copy `.env.example` to `.env.local` and keep mock mode enabled unless live Authentik and Hasura are available.</li>
            <li>Bring up one or more apps with the scoped dev commands so you can validate the shell incrementally.</li>
            <li>Use the command palette inside each app to verify route registration and role-aware navigation.</li>
            <li>Run `pnpm check` before opening a change for review so lint, types, tests, and builds stay aligned.</li>
          </ol>
        </Card>

        <DetailList
          title="Working agreements"
          items={[
            {
              label: 'Mock mode',
              value: 'Treat mock mode as a supported workflow, not a temporary hack. Every feature should remain usable without live platform dependencies.',
            },
            {
              label: 'Auth posture',
              value: 'OIDC and route guards stay explicit. Do not bypass session seams to “simplify” local development.',
            },
            {
              label: 'API discipline',
              value: 'Generated client seams belong in shared packages, while app routes consume them through request-context aware helpers.',
            },
          ]}
        />
      </div>

      <DocsCodePanel
        title="Environment and validation"
        description="Start from the shared environment template, then validate the monorepo the same way CI does."
        tabs={[
          {
            id: 'env',
            label: '.env.local',
            kind: 'code',
            content: envTemplate,
          },
          {
            id: 'commands',
            label: 'Validation commands',
            kind: 'code',
            content: validationCommands,
          },
          {
            id: 'notes',
            label: 'Operating notes',
            content:
              'Use mock mode while backend contracts are stabilizing.\n\nWhen live auth is enabled, verify callback URLs and logout behavior in both applications before merging.\n\nIf a feature depends on a new API surface, add the seam in @bac/api-clients before wiring route-specific fetch logic.',
          },
        ]}
      />
    </div>
  );
}
