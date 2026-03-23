# Local Development

This document explains how to run and validate `AI-Frontend-Experience` locally.

## Prerequisites

- Node.js `20.10` or newer
- pnpm `9.x`
- macOS, Linux, or a compatible shell environment
- optional access to Authentik, SDX, Hasura, and Swagger endpoints if you want live integrations

## First-time setup

1. Install dependencies:

   ```bash
   pnpm install --no-frozen-lockfile
   ```

2. Create your local environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Keep mock mode enabled until you have valid platform endpoints:

   ```env
   NEXT_PUBLIC_BAC_ENABLE_MOCK_API=true
   ```

4. Choose the app you want to run and set the matching callback URL in `.env.local`:

   - Software Factory:

     ```env
     BAC_AUTH_CALLBACK_URL=http://localhost:3000/api/auth/callback
     ```

   - Platform Automation:

     ```env
     BAC_AUTH_CALLBACK_URL=http://localhost:3001/api/auth/callback
     ```

## Useful commands

From the repository root:

```bash
pnpm dev
pnpm dev:software-factory
pnpm dev:platform
pnpm dev:docs
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check
pnpm sync:tokens
pnpm sync:proto
pnpm sync:openapi
```

Equivalent Make targets:

```bash
make dev
make dev-software-factory
make dev-platform
make dev-docs
make check
make sync
```

## App URLs

- Software Factory: `http://localhost:3000`
- Platform Automation: `http://localhost:3001`
- Docs Portal: `http://localhost:3002`

## Environment variables

### Core runtime

- `NEXT_PUBLIC_BAC_ENV`
  - runtime environment label
- `NEXT_PUBLIC_BAC_APP_NAME`
  - app display label
- `NEXT_PUBLIC_BAC_DEFAULT_REGION`
  - default region seed for UI context

### Mock and proxy behavior

- `NEXT_PUBLIC_BAC_ENABLE_MOCK_API`
  - keeps the apps productive without live platform dependencies
- `NEXT_PUBLIC_BAC_PROXY_THROUGH_BFF`
  - forces browser traffic through Next.js proxy routes for backend access

### Authentication

- `NEXT_PUBLIC_BAC_AUTH_BASE_URL`
- `NEXT_PUBLIC_BAC_AUTH_CLIENT_ID`
- `NEXT_PUBLIC_BAC_AUTH_ISSUER_URL`
- `NEXT_PUBLIC_BAC_AUTH_AUTHORIZE_URL`
- `NEXT_PUBLIC_BAC_AUTH_TOKEN_URL`
- `NEXT_PUBLIC_BAC_AUTH_LOGOUT_URL`
- `BAC_AUTH_CLIENT_SECRET`
- `BAC_AUTH_CALLBACK_URL`
- `BAC_SESSION_SECRET`

These must be coherent for live Authentik login. If they are not, use mock mode instead of half-configured live auth.

### Product backends

- `NEXT_PUBLIC_BAC_SDX_API_URL`
- `NEXT_PUBLIC_BAC_PLATFORM_API_URL`
- `NEXT_PUBLIC_BAC_HASURA_URL`
- `NEXT_PUBLIC_BAC_SWAGGER_URL`

### Feature flags

- `NEXT_PUBLIC_BAC_FEATURE_GRAPHIQL`
- `NEXT_PUBLIC_BAC_FEATURE_SWAGGER`
- `NEXT_PUBLIC_BAC_FEATURE_AUDIT_TRAIL`
- `NEXT_PUBLIC_BAC_FEATURE_LIVE_SUBSCRIPTIONS`
- `NEXT_PUBLIC_BAC_FEATURE_OIDC_LOGIN`
- `NEXT_PUBLIC_BAC_FEATURE_PREVIEW_DEPLOYS`

## Recommended local workflows

### UI and frontend workflow development

Use this when you are building screens, components, or navigation:

- keep mock mode enabled
- start one app at a time
- rely on the shared UI, auth, and client packages
- use `pnpm test` and `pnpm typecheck` frequently

### Contract and explorer development

Use this when you are working on GraphQL or Swagger surfaces:

- sync contracts with `pnpm sync:proto` and `pnpm sync:openapi`
- keep BFF proxy mode enabled
- switch to live backend URLs only when the service contracts are reachable

### Docs work

Use this when you are working only on the docs portal or repository docs:

- run `pnpm dev:docs`
- keep mock mode enabled
- validate with `pnpm build` if the route structure changed

## Quality expectations before pushing

Run:

```bash
pnpm check
```

This executes:

- lint
- typecheck
- tests
- production builds

If you are changing only docs, a full `pnpm check` is still preferred before a PR, but it may be skipped for a local docs-only pass when no executable code changed.

## Troubleshooting

### Login loops or callback failures

- verify `BAC_AUTH_CALLBACK_URL` matches the app port
- verify the Authentik client configuration accepts that callback
- fall back to mock mode if live identity is not ready

### Empty dashboards in live mode

- confirm `NEXT_PUBLIC_BAC_PROXY_THROUGH_BFF=true`
- confirm backend URLs are reachable
- confirm session cookies are being issued successfully

### Explorer routes fail

- verify `NEXT_PUBLIC_BAC_SWAGGER_URL` for Swagger explorer
- verify `NEXT_PUBLIC_BAC_HASURA_URL` for GraphQL explorer
- confirm the relevant feature flag is enabled

### Shared package changes are not reflected

- restart the affected `next dev` process
- rerun `pnpm typecheck`
- confirm imports resolve through the workspace package names rather than deep local paths
