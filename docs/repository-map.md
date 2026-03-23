# Repository Map

## Apps

- `apps/software-factory-web`
  - AI Software Factory operator experience
  - delivery, contract, compliance, release, and build surfaces
- `apps/platform-automation-web`
  - AI Platform Automation control-plane experience
  - regions, clusters, workspaces, GitOps, observability, policy, incidents, and GraphQL exploration
- `apps/docs-portal`
  - product documentation, architecture guides, API docs, runbooks, and help center

## Packages

- `packages/ui`
  - shared app shell and enterprise interaction components
- `packages/design-tokens`
  - BAC token sources and transforms
- `packages/api-clients`
  - transport helpers, mocks, and generated-client seams
- `packages/auth`
  - session, claims, cookie, OIDC, and permission logic
- `packages/config`
  - environment parsing, features, and region configuration
- `packages/observability`
  - logging, tracing, metrics, and error boundaries
- `packages/testing`
  - render helpers, fixtures, and MSW support
- `packages/eslint-config`
  - shared ESLint flat-config presets
- `packages/tsconfig`
  - shared TypeScript config bases

## Tooling and support

- `docs/`
  - canonical repo docs and developer guidance
- `scripts/`
  - clean and sync utilities for tokens and API contracts
- `.github/workflows/`
  - CI and release foundations
- `Makefile`
  - convenience targets for local developer workflows
