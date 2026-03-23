# AI-Frontend-Experience

AI-Frontend-Experience is the BAC web experience monorepo. It delivers the browser surfaces for AI Software Factory, AI Platform Automation, and the product documentation portal from one shared frontend platform.

This repository is designed for long-term product growth, not demo-only scaffolding. The baseline is strict TypeScript, Next.js App Router, shared UI and auth packages, BFF proxy routes, role-aware navigation, mock-first integration seams, and CI gates that treat lint, type safety, tests, and builds as release criteria.

## What this repository owns

The repository is the presentation layer for:

- `apps/software-factory-web`: the operator web for PRD intake, architecture review, domain modeling, ADR inspection, API and Swagger exploration, build and test visibility, release operations, compliance posture, and audit-aware settings.
- `apps/platform-automation-web`: the global control-plane console for regions, clusters, workspace factory operations, promise catalog management, GitOps status, observability, policy, identity, incidents, quotas, and runbooks.
- `apps/docs-portal`: the documentation experience for getting started, architecture guidance, API docs, runbooks, and help-center content.

It does not own backend business logic, infrastructure manifests, or design-authoring workflows. Those remain in the backend, platform, and design-factory repositories.

## Architecture snapshot

- Framework: Next.js 15 App Router on all web surfaces.
- Language: TypeScript 5.8+ in strict mode.
- Styling: Tailwind CSS v4 with BAC design tokens.
- AuthN: Authentik-oriented OIDC login and signed session cookies.
- AuthZ: permission-aware routing and guard seams aligned to SpiceDB-style checks.
- Data access: Hasura GraphQL, SDX APIs, OpenAPI/Swagger contracts, and mock mode.
- App model: premium enterprise shell, shared component system, role-aware navigation, BFF proxy routes, observability hooks, and accessible interaction patterns.
- Tooling: pnpm workspaces, Turborepo, Vitest, Playwright foundation, ESLint 9 flat config, and GitHub Actions CI.

BAC doctrine is reflected in the implementation:

- XP: small, shared, testable units over page-level monoliths.
- TDD: critical shells, shared UI, and client seams are structured for test-first iteration.
- DDD: route families and data models follow domain language such as workspaces, promises, builds, contracts, and policy evidence.
- AIDD: scaffolds favor generated clients, typed contracts, and automation-friendly seams.

## Repository shape

```text
AI-Frontend-Experience/
├── apps/
│   ├── software-factory-web/
│   ├── platform-automation-web/
│   └── docs-portal/
├── packages/
│   ├── api-clients/
│   ├── auth/
│   ├── config/
│   ├── design-tokens/
│   ├── observability/
│   ├── testing/
│   ├── ui/
│   ├── eslint-config/
│   └── tsconfig/
├── docs/
├── scripts/
└── .github/workflows/
```

## Shared packages

- `@bac/ui`: app shell, command palette, workspace switcher, tables, drawers, modals, charts, state surfaces, detail views, and docs/code panels.
- `@bac/design-tokens`: token schema, transforms, and enterprise or consumer token sources.
- `@bac/api-clients`: typed HTTP helpers, query provider, mock data, GraphQL and Swagger client seams, and generated-client integration points.
- `@bac/auth`: session schema, cookie signing, claim parsing, OIDC helpers, permission hooks, and route guards.
- `@bac/config`: environment validation, feature flags, and region definitions.
- `@bac/observability`: logger, tracing helper, metrics hook, and error boundary.
- `@bac/testing`: render helpers, fixtures, and MSW handlers.

## Applications and local ports

| App | Purpose | Default port |
| --- | --- | --- |
| `@bac/software-factory-web` | AI Software Factory operator experience | `3000` |
| `@bac/platform-automation-web` | AI Platform Automation control plane | `3001` |
| `@bac/docs-portal` | Product docs and help center | `3002` |

## Quick start

1. Copy `.env.example` to `.env.local`.
2. Update the callback URL for the app you are actively running.
3. Install dependencies:

   ```bash
   pnpm install --no-frozen-lockfile
   ```

4. Start the app you need:

   ```bash
   pnpm dev:software-factory
   pnpm dev:platform
   pnpm dev:docs
   ```

5. Run the full quality gate before pushing:

   ```bash
   pnpm check
   ```

Equivalent Make targets are available:

```bash
make install
make dev-software-factory
make dev-platform
make dev-docs
make check
```

## Environment model

The repository supports two operating modes:

- Mock mode: `NEXT_PUBLIC_BAC_ENABLE_MOCK_API=true`
  - Best for UI and frontend workflow development.
  - Keeps the full shells usable without live Hasura, SDX, or Authentik credentials.
- Live integration mode:
  - Requires valid Authentik endpoints, client credentials, session secret, Hasura URL, SDX API URL, and Swagger artifact URL.
  - When `NEXT_PUBLIC_BAC_PROXY_THROUGH_BFF=true`, browser traffic goes through Next.js API proxy routes instead of direct backend calls.

Important environment values:

- `BAC_SESSION_SECRET`: required for signed session cookies.
- `BAC_AUTH_CALLBACK_URL`: use `http://localhost:3000/api/auth/callback` for Software Factory or `http://localhost:3001/api/auth/callback` for Platform Automation.
- `NEXT_PUBLIC_BAC_HASURA_URL`: Hasura GraphQL origin.
- `NEXT_PUBLIC_BAC_SDX_API_URL`: SDX service origin.
- `NEXT_PUBLIC_BAC_SWAGGER_URL`: Swagger/OpenAPI source used by the explorer.

## Auth, routing, and access model

- Authentik OIDC login is exposed through `/api/auth/login` and `/api/auth/callback` in both authenticated apps.
- Mock login remains available so route systems and page flows can be developed without live identity plumbing.
- Session cookies are signed and parsed in the shared auth package.
- Middleware and layout-level guards enforce route access using the shared BAC permission model.
- Navigation is role-aware and intentionally domain-shaped instead of page-sprawl driven.

## API and explorer model

- Software Factory treats Swagger/OpenAPI as a first-class product surface, not a sidecar utility.
- Platform Automation includes an interactive GraphQL explorer with mock and live execution seams.
- Shared API packages provide the abstraction layer for Hasura, SDX, and future generated clients.
- Proxy routes are ready for token forwarding, audit enrichment, and permission checks as the backend stack matures.

## Quality bar

The baseline expectation for all changes:

- strict TypeScript
- accessible interactions
- responsive layouts
- loading, empty, and error states
- tests for critical shared behavior
- no giant route components when composition can keep the codebase maintainable
- production-oriented names, file layout, and docs

## Sync scripts

- `pnpm sync:tokens`: sync design tokens into the frontend token package.
- `pnpm sync:proto`: sync generated SDX proto artifacts.
- `pnpm sync:openapi`: sync the OpenAPI artifact used by explorer flows.

## Docs

- [Architecture](/Users/AbiolaOgunsakin1/Workflows/AI-Frontend-Experience/docs/ARCHITECTURE.md)
- [Local Development](/Users/AbiolaOgunsakin1/Workflows/AI-Frontend-Experience/docs/LOCAL_DEVELOPMENT.md)
- [Release](/Users/AbiolaOgunsakin1/Workflows/AI-Frontend-Experience/docs/RELEASE.md)
- [Onboarding](/Users/AbiolaOgunsakin1/Workflows/AI-Frontend-Experience/docs/onboarding.md)
- [Repository Map](/Users/AbiolaOgunsakin1/Workflows/AI-Frontend-Experience/docs/repository-map.md)

## Current delivery posture

The repository is production-oriented at the frontend foundation level:

- authenticated app shells are in place
- core route systems are implemented
- shared UI and auth packages are established
- CI gates are active
- mock and live integration seams are both supported

What still depends on platform rollout rather than frontend scaffolding:

- live Authentik tenant credentials
- final Hasura and SDX environment endpoints
- hosting and preview deployment targets
- publishing flow for shared packages if they are externalized later
