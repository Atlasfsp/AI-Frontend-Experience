# Architecture Summary

This scaffold follows the Claude BAC architecture baseline:

- Next.js 15 App Router for all browser surfaces.
- Shared `@bac/*` packages for UI, config, auth, observability, and API clients.
- Authentik-oriented auth seams with a safe mock fallback.
- Hasura-oriented GraphQL explorer scaffolding for platform data access.
- Swagger/OpenAPI explorer scaffolding for SDX REST documentation.
- Strict TypeScript, Turborepo task orchestration, Vitest, and Playwright foundations.

The current repository is intentionally focused on M1-M2 delivery from the architecture backlog: foundations, shells, auth seams, client seams, and operator-facing route scaffolds.
