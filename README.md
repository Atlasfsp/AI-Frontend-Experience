# AI-Frontend-Experience

AI-Frontend-Experience is the BAC web monorepo for the software factory control plane, the platform automation console, and the public-facing docs portal. The repository follows the Claude architecture baseline: Next.js 15 App Router, strict TypeScript, Tailwind foundations, shared `@bac/*` packages, mock-first integration seams, and CI that treats linting, types, tests, and builds as mandatory gates.

## What lives here

- `apps/software-factory-web`: the NeuroForge SDX operator experience.
- `apps/platform-automation-web`: the BAC platform automation console.
- `apps/docs-portal`: architecture, onboarding, runbooks, and API docs.
- `packages/ui`: accessible web UI primitives and app shell components.
- `packages/design-tokens`: BAC design token transforms and CSS variables.
- `packages/api-clients`: typed client scaffolds, mock data, and query helpers.
- `packages/auth`: signed session cookies, Authentik OIDC helpers, role guards, and permission hooks.
- `packages/config`: environment validation, feature flags, and region config.
- `packages/observability`: logger, error boundary, tracing, and lightweight metric hooks.
- `packages/testing`: fixtures, MSW handlers, and test utilities.

## Local development

1. Copy `.env.example` to `.env.local` and adjust URLs, callback port, and secrets.
2. Run `pnpm install --no-frozen-lockfile`.
3. Start a single app with `pnpm dev:software-factory`, `pnpm dev:platform`, or `pnpm dev:docs`.
4. Run the full quality gate with `pnpm check`.

The repository defaults to mock API mode so the shells and route scaffolds work before Authentik, SDX, and Hasura are connected. When `NEXT_PUBLIC_BAC_PROXY_THROUGH_BFF=true`, the app routes API traffic through the Next.js proxy handlers so browser clients never talk directly to Hasura or SDX.

## Auth and API seams

- Authentik OIDC with PKCE is scaffolded for both operator apps via `/api/auth/login` and `/api/auth/callback`.
- Signed session cookies are enforced by middleware and route-level permission maps modeled after the BAC role hierarchy and SpiceDB-style access checks.
- Mock login remains available for local development and CI so product teams can build against real routes before secrets and tenants are provisioned.
- Hasura and SDX proxy routes are ready for BFF-style token forwarding, audit hooks, and future shared-service migration.

## Integration scripts

- `pnpm sync:tokens`: pulls design tokens from `Design-Factory_Figma` when token exports are available.
- `pnpm sync:proto`: vendors generated SDX Connect-ES stubs from `AI-Software-Factory`.
- `pnpm sync:openapi`: copies the SDX OpenAPI artifact for local explorer work.

## Standards

- Strict TypeScript only.
- Accessibility-first UI foundations.
- Responsive layouts across desktop and tablet breakpoints.
- Route protection at middleware and layout level.
- Mock mode is a first-class developer path, not an afterthought.
- Observability is wired as a seam from day one: structured logging, trace helpers, and error boundaries are already in the shared packages.
