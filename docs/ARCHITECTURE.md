# AI-Frontend-Experience Architecture

This document is the repository-specific architecture guide for the BAC web experience layer. The root [`ARCHITECTURE.md`](/Users/AbiolaOgunsakin1/Workflows/AI-Frontend-Experience/ARCHITECTURE.md) captures the broader cross-repo baseline; this file explains how that baseline is applied inside `AI-Frontend-Experience`.

## Purpose

`AI-Frontend-Experience` is the web experience layer for:

- AI Software Factory
- AI Platform Automation
- shared product documentation and operator guidance

The repository exists to provide a cohesive browser experience across these domains while preserving clear boundaries between product concerns, shared packages, and external backend systems.

## Engineering doctrine

The repo follows BAC global engineering doctrine:

- XP
  - small composable components
  - collective ownership through shared packages
  - fast feedback through repo-wide checks
- TDD
  - shared packages and critical flows are structured for testable seams
  - page behavior is built on units that can be validated independently
- DDD
  - routes, features, and models mirror business language such as workspaces, builds, promises, contracts, policy findings, and releases
- AIDD
  - generated-client integration, typed contracts, and automation-friendly scripts are first-class design concerns

## Runtime architecture

### Applications

- `apps/software-factory-web`
  - authenticated operator web for AI Software Factory
  - first-class Swagger and contract exploration
  - build, release, compliance, activity, and workspace flows
- `apps/platform-automation-web`
  - authenticated control-plane console for platform automation
  - GraphQL explorer, workspace operations, region and cluster health, GitOps, policy, and runbooks
- `apps/docs-portal`
  - public or semi-public product documentation experience
  - getting started, architecture, API docs, runbooks, and search-oriented information architecture

### Shared packages

- `packages/ui`
  - premium app shell
  - command palette
  - tables, charts, drawers, modals, timelines, docs panels, and state surfaces
- `packages/auth`
  - claim parsing
  - signed session cookies
  - OIDC utilities
  - permission hooks and guards
- `packages/api-clients`
  - request primitives
  - query provider
  - typed mock datasets
  - SDX, Hasura, and Swagger integration seams
- `packages/config`
  - env parsing
  - feature flags
  - region definitions
- `packages/observability`
  - structured logging
  - tracing helpers
  - metric recording
  - React error boundary
- `packages/design-tokens`
  - token sources and transforms
- `packages/testing`
  - render helpers
  - fixtures
  - MSW support

## Domain boundaries

### AI Software Factory domain

Primary route families:

- `/software-factory/dashboard`
- `/software-factory/workspaces`
- `/software-factory/prd-intake`
- `/software-factory/architecture`
- `/software-factory/domain-model`
- `/software-factory/adrs`
- `/software-factory/api-contracts`
- `/software-factory/swagger`
- `/software-factory/compliance`
- `/software-factory/builds`
- `/software-factory/builds/[buildId]`
- `/software-factory/release-manager`
- `/software-factory/activity`
- `/software-factory/settings`
- `/software-factory/settings/access`
- `/software-factory/settings/audit`
- `/software-factory/agents`
- `/software-factory/work-items`

This domain emphasizes delivery orchestration, contract visibility, release evidence, and compliance-aware operator workflows.

### AI Platform Automation domain

Primary route families:

- `/platform/dashboard`
- `/platform/regions`
- `/platform/clusters`
- `/platform/workspace-factory`
- `/platform/workspaces`
- `/platform/promises`
- `/platform/gitops`
- `/platform/observability`
- `/platform/policy`
- `/platform/identity`
- `/platform/incidents`
- `/platform/quotas`
- `/platform/runbooks`
- `/platform/graphql-explorer`

This domain emphasizes global control-plane visibility, workspace lifecycle operations, policy posture, and operational readiness.

### Docs domain

Primary route families:

- `/`
- `/getting-started`
- `/architecture`
- `/software-factory`
- `/platform`
- `/adrs`
- `/api`
- `/api-reference`
- `/runbooks`
- `/help`
- `/search`

The docs portal is intentionally search-ready and product-structured rather than a flat markdown dump.

## Navigation model

Navigation is built around domain language and permissions.

- Software Factory navigation is organized around delivery, contracts, and settings.
- Platform navigation is organized around control-plane operations and shared tools.
- The shared command palette provides cross-route discovery using route metadata and keywords.
- Workspace switching is elevated into the shell so the user can change operational context without page-specific hacks.

## Authentication and authorization

Authentication and authorization follow the BAC stack:

- AuthN: Authentik-oriented OIDC flow
- AuthZ: permission model aligned to SpiceDB-style checks
- secret posture: session secret and confidential client secret held outside client code

Current implementation details:

- `/api/auth/login` starts OIDC login
- `/api/auth/callback` completes the exchange and establishes the signed session cookie
- mock login routes remain available for local development and CI
- middleware protects authenticated routes
- React and server-side permission helpers allow role-aware navigation and page guards

This repo does not attempt to perform browser-side authorization as the final source of truth. The browser uses route protection and permission-aware rendering, but backend enforcement remains the long-term authority.

## Data and integration model

The data layer is designed around BAC platform constraints:

- Hasura fronts product-facing database access
- SDX services provide software-factory operational APIs
- Swagger or OpenAPI documents remain first-class for contract discovery
- observability and audit systems are expected to integrate through typed client seams

Current client strategy:

- `requestJson` provides a small shared transport primitive
- query-provider support exists for app-wide data caching
- mock datasets keep the apps productive without live backend dependencies
- BFF proxy routes exist for Hasura and SDX requests
- GraphQL explorer and Swagger explorer are embedded product features, not utility afterthoughts

## UI architecture

The UI system is built for enterprise growth:

- shared shell layout with responsive navigation
- reusable detail and data presentation primitives
- accessible drawers, modals, panels, and tables
- loading, empty, and error states as reusable components
- docs and code panels for contract and architecture surfaces
- chart primitives for dashboard and summary pages

The codebase explicitly avoids giant page components where smaller feature modules or shared UI primitives improve maintainability.

## State and rendering

The current frontend strategy favors:

- server rendering where Next.js helps initial load and shell composition
- client components only where interactivity is required
- shared query provider for async data
- feature-local composition for complex dashboards and explorers

Mock-first development is not a temporary shortcut. It is part of the intended workflow so teams can progress on UI architecture before every platform dependency is available.

## Observability

Observability is a built-in seam:

- shared logger for structured frontend logs
- tracing helper for instrumented operations
- metric recording helper for lightweight product telemetry
- React error boundary for shell-level failure isolation

The end-state expectation is OpenTelemetry-backed instrumentation wired into the BAC observability estate.

## Accessibility and responsiveness

The web foundation is expected to be accessible and responsive by default:

- keyboard-safe navigation surfaces
- semantic headings and labels
- reusable state surfaces to avoid silent failure modes
- layouts that remain usable across laptop and tablet widths

## Testing strategy

Current testing layers:

- Vitest for shared package and feature-level tests
- React Testing Library for component behavior
- Playwright configuration as the E2E foundation

Expected direction:

- route-level smoke tests for protected navigation
- explorer workflow tests
- docs search and navigation checks

## Release posture

The repository already has CI foundations:

- PR workflow runs install, lint, typecheck, test, and build
- push workflow runs the full `pnpm check`
- release workflow validates package readiness for manual release execution

Deployment and artifact publication remain intentionally separate from the frontend foundation until hosting, preview, and package-publishing decisions are finalized.
