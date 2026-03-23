# Onboarding

Start with:

- [README.md](/Users/AbiolaOgunsakin1/Workflows/AI-Frontend-Experience/README.md)
- [LOCAL_DEVELOPMENT.md](/Users/AbiolaOgunsakin1/Workflows/AI-Frontend-Experience/docs/LOCAL_DEVELOPMENT.md)
- [ARCHITECTURE.md](/Users/AbiolaOgunsakin1/Workflows/AI-Frontend-Experience/docs/ARCHITECTURE.md)

Recommended first-day path:

1. Install dependencies with `pnpm install --no-frozen-lockfile`.
2. Create `.env.local` from `.env.example`.
3. Keep mock mode enabled unless you already have live Authentik and backend access.
4. Run one app at a time:
   - `pnpm dev:software-factory`
   - `pnpm dev:platform`
   - `pnpm dev:docs`
5. Run `pnpm check` before pushing.

Package ownership guidance:

- reusable browser UI belongs in `packages/ui`
- auth and permission logic belongs in `packages/auth`
- runtime config and feature flags belong in `packages/config`
- network contracts and client abstractions belong in `packages/api-clients`
- telemetry belongs in `packages/observability`
