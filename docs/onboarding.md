# Developer Onboarding

## Prerequisites

- Node.js 20.10 or newer
- pnpm 9.x
- Access to BAC Authentik, SDX, and Hasura endpoints if you want live integration

## First-day workflow

1. Install dependencies with `pnpm install --no-frozen-lockfile`.
2. Create `.env.local` from `.env.example`.
3. Keep `NEXT_PUBLIC_BAC_ENABLE_MOCK_API=true` until the backend endpoints are reachable.
4. Use `pnpm dev:software-factory` for SDX work, `pnpm dev:platform` for platform surfaces, and `pnpm dev:docs` for docs work.
5. Run `pnpm check` before you push.

## Shared package expectations

- Put reusable UI in `packages/ui`.
- Put environment or feature-flag logic in `packages/config`.
- Keep network contracts in `packages/api-clients`.
- Keep auth policy and route guard logic in `packages/auth`.
- Keep telemetry and structured logging in `packages/observability`.
