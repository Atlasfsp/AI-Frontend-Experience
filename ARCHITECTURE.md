# BAC Platform -- Frontend & Mobile Architecture Document

**Product:** StratoGroup Business Activation Cloud (BAC)
**Modules:** AI-Frontend-Experience, AI-Companion-Mobile
**Date:** 2026-03-22
**Classification:** CONFIDENTIAL -- ENGINEERING BASELINE
**Architect:** Claude (Principal Software Architect, StratoGroup)

---

## 1. Repository Purpose & Boundaries

### 1.1 AI-Frontend-Experience

**Purpose:** The unified web presentation layer for the entire BAC platform. Hosts all browser-based interfaces for the AI Software Factory (NeuroForge SDX), the AI Platform Automation system, shared tooling, and documentation.

**In-scope:**
- SDX Build Dashboard (real-time build status, pipeline visualization, agent mesh, gate results, artifact lineage)
- SDX Code Review UI (review-only code inspection with compliance badges)
- Platform Automation Console (workspace lifecycle, promise catalog, cluster health, Fleet sync status)
- Hasura GraphQL Explorer (per-workspace data access console)
- API Explorer / Swagger UI (interactive OpenAPI 3.1 and Connect-ES documentation)
- Docs / Help Center (architecture guides, runbooks, API references, onboarding)
- Admin dashboards (tenant management, billing meters, compliance profiles, user management)
- Operator dashboards (cluster topology, observability overlays, incident management)
- Shared component library (design-system components consuming Design Factory tokens)
- Shared authentication shell (Authentik OIDC login, session management, role switching)

**Out-of-scope:**
- Backend API logic (lives in AI-Software-Factory / neuroforge-sdx)
- Infrastructure manifests (lives in AI-Platform-Automation / bac-platform)
- Design asset generation (lives in Design-Factory_Figma)
- Design governance (lives in Design-Factory_Stitch)
- Mobile experiences (lives in AI-Companion-Mobile)

**Ownership:** Frontend Platform Team. CODEOWNERS for notification only per XP collective ownership.

### 1.2 AI-Companion-Mobile

**Purpose:** A mobile companion application providing on-the-go access to critical platform operations: approvals, alerts, incident response, monitoring, and executive summaries.

**In-scope:**
- Push notification hub (build completions, gate failures, escalations, approval requests)
- Approval workflows (manifest approvals, deployment approvals, access requests)
- Incident response (alert acknowledgment, runbook access, escalation triggers)
- Workspace monitoring (cluster health, promise status, build pipeline status)
- Executive dashboards (KPI summaries, cost tracking, compliance posture)
- Lightweight SDX actions (submit work item, cancel build, view artifacts)
- Lightweight platform actions (scale node pool, trigger rollback, view Fleet sync)
- Audit log viewer (filtered, read-only)
- Biometric / SSO authentication

**Out-of-scope:**
- Full build pipeline management (use web app)
- Code review (use web app)
- Hasura GraphQL exploration (use web app)
- Design system tooling (use web app)
- Infrastructure provisioning (use web app)

**Ownership:** Mobile Platform Team. Same XP collective ownership model.

---

## 2. Tech Stack

### 2.1 AI-Frontend-Experience

| Dimension | Selection | Justification |
|-----------|-----------|---------------|
| Framework | **Next.js 15 (App Router)** | SSR for SEO on docs, RSC for dashboard performance, API routes for BFF proxy, mature ecosystem |
| Language | **TypeScript 5.8+ (strict mode)** | Type safety with proto-generated types, ecosystem alignment with Design-Factory_Figma |
| Styling | **Tailwind CSS v4** | Utility-first, design token integration via CSS custom properties, tree-shaking |
| Component Library | **Radix UI primitives + custom BAC design system** | Headless accessible primitives, custom themed layer consuming Design Factory tokens |
| State Management | **TanStack Query v5** (server state) + **Zustand** (client state) | TanStack for cache/sync with Connect-ES and GraphQL; Zustand for ephemeral UI state |
| API Clients (SDX) | **Connect-ES** (generated from proto via buf) | Type-safe gRPC-Web/Connect protocol, matches existing `gen/typescript/` output |
| API Clients (Platform) | **graphql-request + graphql-codegen** | Type-safe Hasura GraphQL client generation, subscription support via SSE |
| API Clients (REST) | **openapi-typescript + openapi-fetch** | For any REST-only endpoints (OpenAPI 3.1 spec driven) |
| Real-time | **WebSocket** (Connect-ES server streaming) + **Hasura subscriptions** (SSE) | Live build status, live cluster health |
| Auth | **Authentik OIDC via next-auth v5** | Session management, JWT refresh, role extraction from claims |
| Authorization | **SpiceDB permission checks** (via BFF) | Frontend calls BFF, BFF checks SpiceDB before proxying |
| Testing | **Vitest** (unit) + **Playwright** (E2E) + **Storybook** (component visual) | Fast unit tests, cross-browser E2E, visual regression |
| Bundler | **Turbopack** (via Next.js 15) | Native Next.js bundler, faster than Webpack |
| Monorepo | **pnpm workspaces + Turborepo** | Matches Design-Factory_Figma pattern, fast builds with caching |
| Docs engine | **Fumadocs** (Next.js native MDX) | MDX-based, integrated into the same Next.js app, search built-in |
| Observability | **OpenTelemetry JS SDK** | Traces/metrics exported to platform OTel collector |
| Linting | **ESLint 9 flat config + Prettier** | Consistent style, TypeScript-aware rules |
| Package manager | **pnpm 9.x** | Matches Design-Factory_Figma, strict dependency management |

### 2.2 AI-Companion-Mobile

| Dimension | Selection | Justification |
|-----------|-----------|---------------|
| Framework | **React Native + Expo SDK 52** | Code sharing with web TypeScript ecosystem, shared packages with AI-Frontend-Experience, Expo EAS for OTA updates and CI/CD, large talent pool. Flutter was considered but rejected: it cannot share TypeScript packages (Connect-ES clients, Zod schemas, design tokens) with the web app, requiring duplication of the entire API client and validation layer. React Native shares the TypeScript runtime and allows direct import of `@bac/api-clients`, `@bac/contracts`, and `@bac/auth`. |
| Language | **TypeScript 5.8+ (strict mode)** | Same as web for maximum code sharing |
| Navigation | **Expo Router v4** | File-based routing matching Next.js mental model |
| UI Kit | **Tamagui** | Cross-platform (shares design tokens), styled-system approach, compiles to native |
| State Management | **TanStack Query v5 + Zustand** | Same as web, shared query hooks possible |
| API Clients | **Connect-ES + graphql-request** | Same generated clients as web |
| Auth | **expo-auth-session** (Authentik OIDC) + **expo-local-authentication** (biometrics) | Native OIDC PKCE flow + device biometrics |
| Push Notifications | **expo-notifications + FCM/APNs** | Cross-platform push via Expo |
| Testing | **Jest** (unit) + **Maestro** (E2E) | React Native standard, Maestro for native UI flow testing |
| CI/CD | **EAS Build + EAS Submit** | Cloud builds, OTA updates, app store submission |
| Observability | **OpenTelemetry JS SDK + Sentry** | Crash reporting + distributed tracing |

---

## 3. Exact Folder Structures

### 3.1 AI-Frontend-Experience

```
AI-Frontend-Experience/
├── .github/
│   ├── workflows/
│   │   ├── pr.yml
│   │   ├── push.yml
│   │   ├── release.yml
│   │   ├── preview-deploy.yml
│   │   ├── storybook-publish.yml
│   │   └── lighthouse-audit.yml
│   ├── CODEOWNERS
│   └── dependabot.yml
├── .claude/
│   └── CLAUDE.md
├── apps/
│   └── web/
│       ├── app/                          # Next.js App Router
│       │   ├── (auth)/
│       │   │   ├── login/
│       │   │   │   └── page.tsx
│       │   │   ├── callback/
│       │   │   │   └── page.tsx
│       │   │   └── logout/
│       │   │       └── page.tsx
│       │   ├── (dashboard)/
│       │   │   ├── layout.tsx            # Authenticated shell with sidebar
│       │   │   ├── page.tsx              # Home / command center
│       │   │   ├── software-factory/
│       │   │   │   ├── page.tsx          # SDX overview
│       │   │   │   ├── work-items/
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   ├── new/
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   └── [workItemId]/
│       │   │   │   │       └── page.tsx
│       │   │   │   ├── builds/
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   └── [buildId]/
│       │   │   │   │       ├── page.tsx
│       │   │   │   │       ├── pipeline/
│       │   │   │   │       │   └── page.tsx
│       │   │   │   │       ├── gates/
│       │   │   │   │       │   └── page.tsx
│       │   │   │   │       └── artifacts/
│       │   │   │   │           └── page.tsx
│       │   │   │   ├── artifacts/
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   └── [artifactId]/
│       │   │   │   │       └── page.tsx
│       │   │   │   ├── agents/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── code-review/
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   └── [reviewId]/
│       │   │   │   │       └── page.tsx
│       │   │   │   ├── compliance/
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   └── [buildId]/
│       │   │   │   │       └── page.tsx
│       │   │   │   ├── analytics/
│       │   │   │   │   └── page.tsx
│       │   │   │   └── webhooks/
│       │   │   │       └── page.tsx
│       │   │   ├── platform/
│       │   │   │   ├── page.tsx          # Platform overview
│       │   │   │   ├── clusters/
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   └── [clusterId]/
│       │   │   │   │       └── page.tsx
│       │   │   │   ├── workspaces/
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   └── [workspaceId]/
│       │   │   │   │       └── page.tsx
│       │   │   │   ├── promises/
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   └── [promiseId]/
│       │   │   │   │       └── page.tsx
│       │   │   │   ├── fleet/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── data-access/
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   └── [endpointId]/
│       │   │   │   │       └── page.tsx
│       │   │   │   ├── observability/
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   ├── metrics/
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── traces/
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── logs/
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   └── alerts/
│       │   │   │   │       └── page.tsx
│       │   │   │   ├── networking/
│       │   │   │   │   └── page.tsx
│       │   │   │   └── compliance/
│       │   │   │       └── page.tsx
│       │   │   ├── admin/
│       │   │   │   ├── page.tsx
│       │   │   │   ├── tenants/
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   └── [tenantId]/
│       │   │   │   │       └── page.tsx
│       │   │   │   ├── users/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── billing/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── audit-log/
│       │   │   │   │   └── page.tsx
│       │   │   │   └── settings/
│       │   │   │       └── page.tsx
│       │   │   └── settings/
│       │   │       ├── page.tsx
│       │   │       ├── profile/
│       │   │       │   └── page.tsx
│       │   │       ├── workspace/
│       │   │       │   └── page.tsx
│       │   │       ├── api-keys/
│       │   │       │   └── page.tsx
│       │   │       ├── notifications/
│       │   │       │   └── page.tsx
│       │   │       └── integrations/
│       │   │           └── page.tsx
│       │   ├── api-explorer/
│       │   │   ├── page.tsx
│       │   │   ├── sdx/
│       │   │   │   └── page.tsx
│       │   │   └── platform/
│       │   │       └── page.tsx
│       │   ├── docs/
│       │   │   ├── layout.tsx
│       │   │   ├── [[...slug]]/
│       │   │   │   └── page.tsx
│       │   │   └── content/             # MDX content
│       │   │       ├── getting-started/
│       │   │       ├── software-factory/
│       │   │       ├── platform/
│       │   │       ├── api-reference/
│       │   │       ├── runbooks/
│       │   │       └── adrs/
│       │   ├── api/                     # BFF API routes
│       │   │   ├── auth/
│       │   │   │   └── [...nextauth]/
│       │   │   │       └── route.ts
│       │   │   ├── proxy/
│       │   │   │   ├── sdx/
│       │   │   │   │   └── [...path]/
│       │   │   │   │       └── route.ts
│       │   │   │   └── hasura/
│       │   │   │       └── [...path]/
│       │   │   │           └── route.ts
│       │   │   └── health/
│       │   │       └── route.ts
│       │   ├── layout.tsx               # Root layout
│       │   ├── not-found.tsx
│       │   └── error.tsx
│       ├── lib/
│       │   ├── auth.ts                  # next-auth config
│       │   ├── spicedb.ts               # SpiceDB permission checker
│       │   └── env.ts                   # Environment validation (Zod)
│       ├── middleware.ts                 # Auth + tenant context middleware
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       ├── package.json
│       ├── Dockerfile
│       └── vitest.config.ts
├── packages/
│   ├── ui/                              # BAC Design System components
│   │   ├── src/
│   │   │   ├── primitives/              # Radix-based low-level primitives
│   │   │   │   ├── button.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   ├── toast.tsx
│   │   │   │   ├── tooltip.tsx
│   │   │   │   └── index.ts
│   │   │   ├── composites/              # Higher-order composed components
│   │   │   │   ├── app-shell.tsx
│   │   │   │   ├── data-table.tsx
│   │   │   │   ├── form-field.tsx
│   │   │   │   ├── stat-card.tsx
│   │   │   │   ├── pipeline-graph.tsx
│   │   │   │   ├── status-badge.tsx
│   │   │   │   ├── tenant-switcher.tsx
│   │   │   │   ├── workspace-switcher.tsx
│   │   │   │   ├── command-palette.tsx
│   │   │   │   └── index.ts
│   │   │   ├── charts/
│   │   │   │   ├── area-chart.tsx
│   │   │   │   ├── bar-chart.tsx
│   │   │   │   ├── line-chart.tsx
│   │   │   │   ├── donut-chart.tsx
│   │   │   │   └── index.ts
│   │   │   ├── icons/
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsup.config.ts
│   ├── tokens/                          # Design token bridge
│   │   ├── src/
│   │   │   ├── transform.ts             # Transforms Design-Factory_Figma JSON → Tailwind theme + CSS vars
│   │   │   ├── tailwind-preset.ts       # Tailwind v4 preset consuming tokens
│   │   │   ├── css-variables.ts         # CSS custom property generator
│   │   │   ├── native-theme.ts          # React Native / Tamagui theme generator
│   │   │   └── index.ts
│   │   ├── tokens/                      # Vendored from Design-Factory_Figma output
│   │   │   ├── enterprise.json
│   │   │   └── consumer.json
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── api-clients/                     # Generated + wrapped API clients
│   │   ├── src/
│   │   │   ├── sdx/
│   │   │   │   ├── client.ts            # Connect-ES transport factory
│   │   │   │   ├── hooks.ts             # TanStack Query hooks wrapping Connect-ES
│   │   │   │   └── index.ts
│   │   │   ├── platform/
│   │   │   │   ├── client.ts            # GraphQL client factory (Hasura)
│   │   │   │   ├── hooks.ts             # TanStack Query hooks wrapping GraphQL
│   │   │   │   ├── subscriptions.ts     # Hasura live query subscriptions
│   │   │   │   └── index.ts
│   │   │   ├── generated/               # Auto-generated (do not edit)
│   │   │   │   ├── sdx/                 # Symlink or copy from neuroforge-sdx gen/typescript/
│   │   │   │   └── platform/            # graphql-codegen output from Hasura introspection
│   │   │   └── index.ts
│   │   ├── codegen.ts                   # graphql-codegen config
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── auth/                            # Shared auth utilities
│   │   ├── src/
│   │   │   ├── session.ts               # Session types, token refresh
│   │   │   ├── claims.ts                # JWT claim parsing (sub, tenant_id, workspace_id, roles)
│   │   │   ├── permissions.ts           # SpiceDB permission check helpers
│   │   │   ├── guards.tsx               # React components: RequireRole, RequirePermission
│   │   │   ├── hooks.ts                 # useSession, useTenant, useWorkspace, usePermission
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── config/                          # Shared configuration
│   │   ├── src/
│   │   │   ├── env.ts                   # Environment schema (Zod), NF_ prefix for SDX, BAC_ for platform
│   │   │   ├── feature-flags.ts         # Feature flag client
│   │   │   ├── regions.ts               # NexoRegion mappings, API base URLs
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── observability/                   # Shared telemetry
│   │   ├── src/
│   │   │   ├── tracer.ts                # OTel trace provider
│   │   │   ├── metrics.ts               # Web vitals + custom metrics
│   │   │   ├── logger.ts                # Structured logging (JSON, tenant_id, trace_id)
│   │   │   ├── error-boundary.tsx       # Error boundary with OTel reporting
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── testing/                         # Shared test utilities
│       ├── src/
│       │   ├── render.tsx               # Custom render with providers
│       │   ├── mocks/
│       │   │   ├── sdx-handlers.ts      # MSW handlers for SDX APIs
│       │   │   ├── hasura-handlers.ts   # MSW handlers for Hasura
│       │   │   └── auth-handlers.ts     # MSW handlers for Authentik
│       │   ├── fixtures/
│       │   │   ├── tenants.ts
│       │   │   ├── builds.ts
│       │   │   ├── work-items.ts
│       │   │   └── clusters.ts
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── codex/
│   ├── factory.yaml
│   ├── handoff.md
│   ├── backlog.md
│   └── acceptance-criteria.md
├── docs/
│   ├── adr/
│   │   ├── ADR-001-separate-frontend-repo.md
│   │   ├── ADR-002-nextjs-15-app-router.md
│   │   ├── ADR-003-react-native-expo-over-flutter.md
│   │   ├── ADR-004-authentik-oidc-with-next-auth.md
│   │   ├── ADR-005-connect-es-for-sdx-api-clients.md
│   │   ├── ADR-006-design-token-pipeline.md
│   │   ├── ADR-007-testing-strategy-vitest-playwright.md
│   │   ├── ADR-008-otel-frontend-observability.md
│   │   ├── ADR-009-trunk-based-development-with-preview-deploys.md
│   │   ├── ADR-010-bff-pattern-for-auth-proxy.md
│   │   ├── ADR-011-pnpm-turborepo-monorepo.md
│   │   └── ADR-012-hasura-graphql-subscriptions.md
│   └── architecture.md
├── scripts/
│   ├── generate-api-clients.sh
│   ├── sync-design-tokens.sh
│   ├── sync-proto-types.sh
│   └── health-check.ts
├── .env.example
├── .gitignore
├── .eslintrc.js
├── .prettierrc
├── docker-compose.yml
├── Dockerfile
├── Makefile
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
└── README.md
```

### 3.2 AI-Companion-Mobile

```
AI-Companion-Mobile/
├── .github/
│   ├── workflows/
│   │   ├── pr.yml
│   │   ├── eas-build.yml
│   │   ├── eas-update.yml
│   │   └── maestro-e2e.yml
│   ├── CODEOWNERS
│   └── dependabot.yml
├── .claude/
│   └── CLAUDE.md
├── apps/
│   └── mobile/
│       ├── app/                          # Expo Router file-based routes
│       │   ├── _layout.tsx               # Root layout with auth gate
│       │   ├── (auth)/
│       │   │   ├── login.tsx
│       │   │   └── biometric.tsx
│       │   ├── (tabs)/
│       │   │   ├── _layout.tsx           # Tab navigator
│       │   │   ├── index.tsx             # Dashboard / home
│       │   │   ├── alerts.tsx            # Alert feed
│       │   │   ├── approvals.tsx         # Approval queue
│       │   │   └── settings.tsx          # Settings hub
│       │   ├── builds/
│       │   │   ├── index.tsx
│       │   │   └── [buildId].tsx
│       │   ├── work-items/
│       │   │   ├── index.tsx
│       │   │   └── [workItemId].tsx
│       │   ├── incidents/
│       │   │   ├── index.tsx
│       │   │   └── [incidentId].tsx
│       │   ├── clusters/
│       │   │   ├── index.tsx
│       │   │   └── [clusterId].tsx
│       │   ├── workspaces/
│       │   │   └── [workspaceId].tsx
│       │   ├── audit-log/
│       │   │   └── index.tsx
│       │   ├── approvals/
│       │   │   └── [approvalId].tsx
│       │   ├── notifications/
│       │   │   └── index.tsx
│       │   └── settings/
│       │       ├── profile.tsx
│       │       ├── workspace.tsx
│       │       ├── notifications.tsx
│       │       └── about.tsx
│       ├── components/
│       │   ├── dashboard/
│       │   │   ├── kpi-card.tsx
│       │   │   ├── build-summary.tsx
│       │   │   ├── cluster-health.tsx
│       │   │   └── cost-tracker.tsx
│       │   ├── approvals/
│       │   │   ├── approval-card.tsx
│       │   │   └── approval-action-sheet.tsx
│       │   ├── alerts/
│       │   │   ├── alert-card.tsx
│       │   │   └── alert-filter.tsx
│       │   ├── incidents/
│       │   │   ├── incident-card.tsx
│       │   │   └── runbook-viewer.tsx
│       │   └── shared/
│       │       ├── status-indicator.tsx
│       │       ├── tenant-header.tsx
│       │       └── pull-to-refresh.tsx
│       ├── lib/
│       │   ├── auth.ts
│       │   ├── notifications.ts
│       │   ├── biometrics.ts
│       │   └── env.ts
│       ├── app.config.ts
│       ├── metro.config.js
│       ├── package.json
│       ├── tsconfig.json
│       └── eas.json
├── packages/
│   ├── mobile-ui/                       # Mobile-specific Tamagui components
│   │   ├── src/
│   │   │   ├── primitives/
│   │   │   ├── composites/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── shared/                          # Symlinks/copies from AI-Frontend-Experience
│       └── README.md                    # Instructions to install @bac/* packages
├── codex/
│   ├── factory.yaml
│   ├── handoff.md
│   ├── backlog.md
│   └── acceptance-criteria.md
├── docs/
│   └── adr/
│       ├── ADR-001-react-native-expo.md
│       └── ADR-002-tamagui-ui-kit.md
├── e2e/
│   ├── flows/
│   │   ├── login.yaml
│   │   ├── approve-build.yaml
│   │   ├── view-alerts.yaml
│   │   └── incident-response.yaml
│   └── maestro-config.yaml
├── scripts/
│   ├── sync-shared-packages.sh
│   └── generate-icons.sh
├── .env.example
├── .gitignore
├── Makefile
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── README.md
```

---

## 4. Shared Package Strategy

The two repos share code through **published npm packages** under the `@bac` scope, hosted on a private GitHub Packages registry.

### 4.1 Package Matrix

| Package | Scope | Published From | Consumed By | Description |
|---------|-------|---------------|-------------|-------------|
| `@bac/ui` | Web-only | AI-Frontend-Experience | AI-Frontend-Experience web app | Radix + Tailwind design system components |
| `@bac/mobile-ui` | Mobile-only | AI-Companion-Mobile | AI-Companion-Mobile app | Tamagui mobile components |
| `@bac/tokens` | Cross-platform | AI-Frontend-Experience | Both repos | Design token transform layer: Tailwind preset (web), Tamagui theme (mobile) |
| `@bac/api-clients` | Cross-platform | AI-Frontend-Experience | Both repos | Connect-ES + GraphQL clients with TanStack Query hooks |
| `@bac/auth` | Cross-platform | AI-Frontend-Experience | Both repos | Session, JWT claims, permission guards, hooks |
| `@bac/config` | Cross-platform | AI-Frontend-Experience | Both repos | Environment config, feature flags, region mappings |
| `@bac/observability` | Cross-platform | AI-Frontend-Experience | Both repos | OTel tracer, metrics, structured logger |
| `@bac/testing` | Dev-only | AI-Frontend-Experience | Both repos | MSW handlers, fixtures, test render utilities |

### 4.2 Publication Flow

1. **AI-Frontend-Experience** publishes `@bac/*` packages to GitHub Packages on every `main` merge (semantic-release with conventional commits).
2. **AI-Companion-Mobile** installs `@bac/*` packages from GitHub Packages as regular npm dependencies.
3. Cross-platform packages use conditional exports: `"import"` for web ESM, `"react-native"` for RN bundler resolution.
4. Design tokens are vendored from Design-Factory_Figma output via `scripts/sync-design-tokens.sh` in AI-Frontend-Experience, then published as part of `@bac/tokens`.

### 4.3 Dependency Direction

```
Design-Factory_Figma (tokens JSON)
        │
        ▼
AI-Frontend-Experience (@bac/tokens, @bac/ui, @bac/api-clients, @bac/auth, ...)
        │
        ▼  (npm publish to GitHub Packages)
AI-Companion-Mobile (consumes @bac/tokens, @bac/api-clients, @bac/auth, ...)
```

AI-Companion-Mobile **never** depends directly on AI-Frontend-Experience source. It depends on published packages only.

---

## 5. Integration Model

### 5.1 Integration with AI-Software-Factory (neuroforge-sdx)

**Proto-generated TypeScript clients:**
- neuroforge-sdx runs `buf generate` producing Connect-ES TypeScript stubs in `gen/typescript/sdx/v1/`.
- AI-Frontend-Experience runs `scripts/sync-proto-types.sh` which copies `gen/typescript/` from neuroforge-sdx into `packages/api-clients/src/generated/sdx/`.
- This happens in CI on a schedule (daily) and can be triggered manually.
- The `@bac/api-clients` package wraps these generated stubs with TanStack Query hooks, transport configuration (auth headers, tenant context, base URL routing per NexoRegion), and error normalization.

**OpenAPI spec:**
- neuroforge-sdx serves `openapi.yaml` / `openapi.json` at `/api/v1/openapi.json`.
- The API Explorer page in AI-Frontend-Experience loads this spec at runtime and renders it using a custom Swagger UI implementation.
- No build-time dependency on the OpenAPI file.

**Events (real-time):**
- Build status, gate results, agent health updates are streamed via Connect-ES server-streaming RPCs.
- The web app subscribes via `useQuery` with `refetchInterval` for polling fallback, and Connect-ES streaming for live updates where available.
- Event types are defined in `events.proto` and available as TypeScript types in the generated stubs.

**Authentication flow:**
- User authenticates via Authentik OIDC (handled by next-auth in BFF).
- BFF injects JWT Bearer token + `x-tenant-id` + `x-workspace-id` headers when proxying requests to the SDX gateway.
- The SDX gateway at `:8080` validates the JWT and extracts tenant context from gRPC metadata.

### 5.2 Integration with AI-Platform-Automation (bac-platform)

**Hasura GraphQL:**
- Each workspace has a Hasura endpoint provisioned via the `hasura-endpoint` Kratix promise.
- AI-Frontend-Experience's `@bac/api-clients` platform client connects to the workspace's Hasura endpoint URL (obtained from workspace metadata).
- `graphql-codegen` introspects the Hasura schema and generates TypeScript types + typed operations.
- Hasura subscriptions (via SSE) provide live workspace data updates.

**Kubernetes APIs (read-only):**
- Cluster status, Fleet sync state, promise status, and workspace lifecycle information are exposed through a BFF API route (`/api/proxy/platform/[...path]`) that proxies to Rancher's API.
- The BFF validates SpiceDB permissions before proxying each request.
- No direct K8s API access from the browser.

**Promise catalog:**
- The promise catalog UI reads Kratix `Promise` CRDs (via Rancher API proxy) and renders them as a self-service catalog.
- Claim submission posts a `ResourceRequest` CR through the same proxy.

### 5.3 Integration with Design-Factory_Stitch

**Design DNA:**
- `DESIGN.md` from the Stitch factory defines tone, interaction model, accessibility expectations, and product personality.
- This document is consumed by AI-Frontend-Experience as an MDX doc in `apps/web/app/docs/content/` and as implementation guidance for the `@bac/ui` component library.
- Screen maps from Stitch define the route structure and navigation hierarchy for the frontend.

**Handoff packs:**
- Stitch's codex-pack (handoff to Codex) includes component specifications, state coverage, and API-wiring expectations.
- These are consumed as implementation specifications for `@bac/ui` composites.

### 5.4 Integration with Design-Factory_Figma

**Design tokens:**
- Design-Factory_Figma publishes token JSON files (`enterprise.json`, `consumer.json`) conforming to the `TokensSchema` Zod schema (color, typography, spacing, radius, elevation, components).
- `scripts/sync-design-tokens.sh` copies these files into `packages/tokens/tokens/`.
- `@bac/tokens` transforms these into:
  - **Tailwind v4 preset** (`tailwind-preset.ts`) with CSS custom properties mapped to token values.
  - **Tamagui theme** (`native-theme.ts`) for React Native.
  - **Raw CSS variables** (`css-variables.ts`) for non-Tailwind contexts.

**Screen specs:**
- Screen specs (`ScreenSpecSchema`) define sections, components, copy blocks, and interactions.
- These are consumed as implementation blueprints for page layouts.
- The `kind` field (app-shell, card, table, form, chart, navigation, list, detail, stat, hero, cta) maps directly to `@bac/ui` component names.

**Template catalogs:**
- Module templates (dashboard.json, auth.json, reports.json, settings.json) define default sections and expected components.
- These inform the page scaffold for each route group.

---

## 6. Frontend Route Map (AI-Frontend-Experience)

### 6.1 Complete Route Table

| Route | Page | Auth | Roles | Description |
|-------|------|------|-------|-------------|
| **Authentication** | | | | |
| `/login` | Login | No | All | Authentik OIDC redirect |
| `/callback` | OAuth callback | No | All | OIDC token exchange |
| `/logout` | Logout | Yes | All | Session destroy + redirect |
| **Home** | | | | |
| `/` | Command Center | Yes | All | Unified dashboard: recent builds, alerts, workspace summary |
| **Software Factory** | | | | |
| `/software-factory` | SDX Overview | Yes | MEMBER+ | Build pipeline summary, active builds, agent utilization |
| `/software-factory/work-items` | Work Item List | Yes | MEMBER+ | Paginated, filterable work item table |
| `/software-factory/work-items/new` | Submit Work Item | Yes | MEMBER+ | PRD/story/spec submission form |
| `/software-factory/work-items/[workItemId]` | Work Item Detail | Yes | MEMBER+ | Requirements, ambiguities, manifest, status |
| `/software-factory/builds` | Build List | Yes | MEMBER+ | Active + historical builds with filters |
| `/software-factory/builds/[buildId]` | Build Detail | Yes | MEMBER+ | Build overview, current stage, timeline |
| `/software-factory/builds/[buildId]/pipeline` | Pipeline View | Yes | MEMBER+ | 16-stage pipeline visualization (Mermaid/D3) |
| `/software-factory/builds/[buildId]/gates` | Gate Results | Yes | MEMBER+ | 14 quality gates with pass/fail/remediation |
| `/software-factory/builds/[buildId]/artifacts` | Build Artifacts | Yes | MEMBER+ | Artifact list, download links, SBOM, provenance |
| `/software-factory/artifacts` | Artifact Registry | Yes | MEMBER+ | Global artifact search, verification |
| `/software-factory/artifacts/[artifactId]` | Artifact Detail | Yes | MEMBER+ | Signature, provenance, SBOM, deployment history |
| `/software-factory/agents` | Agent Mesh | Yes | ADMIN+ | Agent grid: status, model config, health, assignments |
| `/software-factory/code-review` | Code Review List | Yes | MEMBER+ | Pending reviews |
| `/software-factory/code-review/[reviewId]` | Code Review Detail | Yes | MEMBER+ | Diff view, compliance annotations, approval |
| `/software-factory/compliance` | Compliance Dashboard | Yes | MEMBER+ | Framework coverage, control mapping, evidence |
| `/software-factory/compliance/[buildId]` | Build Compliance | Yes | MEMBER+ | Per-build compliance evidence package |
| `/software-factory/analytics` | SDX Analytics | Yes | ADMIN+ | Build metrics, cost, agent utilization, trends |
| `/software-factory/webhooks` | Webhooks | Yes | ADMIN+ | Webhook CRUD, delivery logs, test |
| **Platform** | | | | |
| `/platform` | Platform Overview | Yes | VIEWER+ | Cluster topology, region health, promise utilization |
| `/platform/clusters` | Cluster List | Yes | VIEWER+ | All clusters across regions |
| `/platform/clusters/[clusterId]` | Cluster Detail | Yes | VIEWER+ | Node status, workloads, policies, Fleet sync |
| `/platform/workspaces` | Workspace List | Yes | VIEWER+ | Workspaces with tenant class, status, members |
| `/platform/workspaces/[workspaceId]` | Workspace Detail | Yes | VIEWER+ | Members, quotas, promises claimed, network policies |
| `/platform/promises` | Promise Catalog | Yes | MEMBER+ | Self-service platform capabilities |
| `/platform/promises/[promiseId]` | Promise Detail / Claim | Yes | MEMBER+ | Promise spec, claim form, existing claims |
| `/platform/fleet` | Fleet Dashboard | Yes | ADMIN+ | Bundle sync status, drift detection, GitRepo status |
| `/platform/data-access` | Data Access List | Yes | MEMBER+ | Hasura endpoints per workspace |
| `/platform/data-access/[endpointId]` | GraphQL Explorer | Yes | MEMBER+ | Interactive GraphQL IDE (GraphiQL-like) |
| `/platform/observability` | Observability Hub | Yes | VIEWER+ | Metrics, traces, logs, alerts overview |
| `/platform/observability/metrics` | Metrics Explorer | Yes | VIEWER+ | VictoriaMetrics / Grafana embed |
| `/platform/observability/traces` | Trace Explorer | Yes | VIEWER+ | Tempo trace viewer |
| `/platform/observability/logs` | Log Explorer | Yes | VIEWER+ | Quickwit / OpenObserve log search |
| `/platform/observability/alerts` | Alert Manager | Yes | ADMIN+ | Active alerts, silence rules, escalation |
| `/platform/networking` | Network Topology | Yes | ADMIN+ | ClusterMesh visualization, Cilium policies |
| `/platform/compliance` | Platform Compliance | Yes | ADMIN+ | CIS benchmarks, Kyverno policy status, Trivy scans |
| **Admin** | | | | |
| `/admin` | Admin Overview | Yes | ADMIN+ | Tenant count, user count, system health |
| `/admin/tenants` | Tenant List | Yes | PLATFORM_ADMIN | All tenants with plan, status, region |
| `/admin/tenants/[tenantId]` | Tenant Detail | Yes | PLATFORM_ADMIN | Plan management, quotas, suspension, compliance |
| `/admin/users` | User Management | Yes | ADMIN+ | User list, role assignments, SSO status |
| `/admin/billing` | Billing Dashboard | Yes | OWNER+ | Billing meters, cost per tenant, usage charts |
| `/admin/audit-log` | Audit Log | Yes | AUDIT_READER+ | Hash-chain verified audit trail, filters, export |
| `/admin/settings` | System Settings | Yes | PLATFORM_ADMIN | Platform-wide config, feature flags |
| **Settings (User)** | | | | |
| `/settings` | Settings Hub | Yes | All | Profile, workspace, API keys, notifications |
| `/settings/profile` | Profile | Yes | All | Name, email, avatar, timezone |
| `/settings/workspace` | Workspace Settings | Yes | ADMIN+ | Workspace name, members, compliance profile |
| `/settings/api-keys` | API Keys | Yes | MEMBER+ | Generate, revoke, view usage |
| `/settings/notifications` | Notification Prefs | Yes | All | Email/push/in-app notification config |
| `/settings/integrations` | Integrations | Yes | ADMIN+ | Webhook endpoints, SCM connections |
| **API Explorer** | | | | |
| `/api-explorer` | API Explorer Hub | Yes | MEMBER+ | Links to SDX and Platform API docs |
| `/api-explorer/sdx` | SDX API Explorer | Yes | MEMBER+ | Interactive Swagger/Connect UI for SDX gateway |
| `/api-explorer/platform` | Platform API Explorer | Yes | MEMBER+ | Hasura GraphiQL + Rancher API docs |
| **Docs** | | | | |
| `/docs` | Docs Home | No | All | Getting started, search |
| `/docs/getting-started/*` | Getting Started | No | All | Onboarding guides |
| `/docs/software-factory/*` | SDX Docs | No | All | SDX concepts, agent types, pipeline, gates |
| `/docs/platform/*` | Platform Docs | No | All | Platform architecture, promises, bootstrap |
| `/docs/api-reference/*` | API Reference | No | All | Generated from OpenAPI + proto |
| `/docs/runbooks/*` | Runbooks | Yes | MEMBER+ | Operational runbooks |
| `/docs/adrs/*` | ADR Index | No | All | Architecture Decision Records |

---

## 7. Mobile Feature Map (AI-Companion-Mobile)

### 7.1 Complete Screen Map

| Screen | Tab | Auth | Description |
|--------|-----|------|-------------|
| **Authentication** | | | |
| Login | -- | No | Authentik OIDC PKCE flow via system browser |
| Biometric Unlock | -- | Partial | Face ID / fingerprint for returning sessions |
| **Dashboard (Home Tab)** | Home | Yes | |
| Dashboard Home | Home | Yes | KPI cards: active builds, open alerts, pending approvals, cluster health score |
| Build Summary Widget | Home | Yes | Last 5 builds with status, tap to navigate |
| Cost Tracker Widget | Home | Yes | MTD spend by tenant, LLM token cost |
| Cluster Health Widget | Home | Yes | Region-level health indicators |
| **Alerts (Alerts Tab)** | Alerts | Yes | |
| Alert Feed | Alerts | Yes | Chronological alert list with severity filters |
| Alert Detail | Alerts | Yes | Full alert payload, acknowledge button, escalation |
| Alert Filters | Alerts | Yes | By severity, source (SDX/platform), time range |
| **Approvals (Approvals Tab)** | Approvals | Yes | |
| Approval Queue | Approvals | Yes | Pending approvals: manifest, deployment, access |
| Approval Detail | Approvals | Yes | Full context, approve/reject with comment |
| Manifest Approval | Approvals | Yes | Work item manifest review, language/compliance check |
| Deployment Approval | Approvals | Yes | Environment, artifact summary, SLO check |
| Access Request Approval | Approvals | Yes | User, role, workspace, justification |
| **Settings (Settings Tab)** | Settings | Yes | |
| Settings Hub | Settings | Yes | Profile, workspace, notifications, about |
| Profile | Settings | Yes | Name, role, tenant, timezone |
| Workspace Selector | Settings | Yes | Switch active workspace |
| Notification Preferences | Settings | Yes | Push channels, quiet hours |
| About | Settings | Yes | Version, region, terms |
| **Deep Screens (Stack Nav)** | | | |
| Build List | -- | Yes | Filterable build list, search |
| Build Detail | -- | Yes | Build status, current stage, gate results, artifacts |
| Work Item List | -- | Yes | Work items for current workspace |
| Work Item Detail | -- | Yes | Requirements, status, associated builds |
| Work Item Submit | -- | Yes | Quick PRD submission (text + optional file) |
| Incident List | -- | Yes | Open incidents with severity |
| Incident Detail | -- | Yes | Timeline, runbook link, escalation controls |
| Incident Acknowledge | -- | Yes | One-tap acknowledge with optional note |
| Cluster List | -- | Yes | Clusters by region with health status |
| Cluster Detail | -- | Yes | Node count, workloads, Fleet sync, storage |
| Workspace Detail | -- | Yes | Members, quotas, claimed promises |
| Audit Log | -- | Yes | Filtered audit entries (read-only, last 7 days) |
| Notification History | -- | Yes | All received push notifications |

### 7.2 Push Notification Categories

| Category | Source | Priority | Action |
|----------|--------|----------|--------|
| `build.completed` | SDX | Normal | Navigate to build detail |
| `build.failed` | SDX | High | Navigate to build detail |
| `gate.failed` | SDX | High | Navigate to gate results |
| `escalation.triggered` | SDX | Critical | Navigate to incident detail |
| `approval.requested` | SDX/Platform | High | Navigate to approval detail |
| `alert.fired` | Platform | Varies | Navigate to alert detail |
| `cluster.unhealthy` | Platform | Critical | Navigate to cluster detail |
| `deployment.failed` | Platform | High | Navigate to deployment detail |
| `quota.exhausted` | SDX | Normal | Navigate to billing |
| `compliance.drift` | Platform | High | Navigate to compliance |

---

## 8. Deployment Model

### 8.1 AI-Frontend-Experience

**Environments:**

| Environment | Trigger | URL Pattern | Infrastructure |
|-------------|---------|-------------|----------------|
| Preview | PR opened/updated | `pr-{number}.preview.bac.stratogroup.io` | Kubernetes Job per PR (auto-destroyed on merge) |
| Staging | Merge to `main` | `staging.bac.stratogroup.io` | Dedicated Kubernetes Deployment in ng-dev cluster |
| Production | Git tag `v*` | `app.bac.stratogroup.io` | Kubernetes Deployment in region-prod clusters (ng, za, eu) |

**Containerization:**
- Single Dockerfile: multi-stage build (Node 22 alpine for build, Node 22 alpine slim for runtime).
- Image published to `ghcr.io/stratogroup/bac-frontend/web:sha-{commit}`.
- Image signed with Cosign, SBOM generated with Syft.
- Kubernetes Deployment with 3 replicas (prod), HPA min 3 / max 20 based on CPU and request rate.

**GitOps integration:**
- Fleet GitRepo watches the AI-Frontend-Experience repo's `deploy/` directory.
- `deploy/base/` contains Kubernetes manifests (Deployment, Service, Ingress, HPA, PDB, NetworkPolicy).
- `deploy/overlays/staging/` and `deploy/overlays/production/` contain kustomize patches.
- On `main` merge: CI builds image, updates image digest in `deploy/overlays/staging/kustomization.yaml`, Fleet syncs to ng-dev.
- On tag: CI promotes staging image to production overlay, Fleet syncs to all region-prod clusters.

**CI/CD (GitHub Actions):**

| Workflow | Trigger | Steps |
|----------|---------|-------|
| `pr.yml` | PR opened/sync | Lint, typecheck, unit tests, build, Lighthouse CI, preview deploy |
| `push.yml` | Push to main | Lint, typecheck, unit tests, build, container build+push, sign, SBOM, staging deploy |
| `release.yml` | Tag v* | Promote staging image to production, Fleet sync, smoke tests |
| `preview-deploy.yml` | PR label `preview` | Build and deploy to preview URL |
| `storybook-publish.yml` | Push to main | Build and publish Storybook to GitHub Pages |
| `lighthouse-audit.yml` | Schedule (daily) | Performance audit against staging |

### 8.2 AI-Companion-Mobile

**Environments:**

| Environment | Channel | Distribution |
|-------------|---------|-------------|
| Development | `development` | EAS Build for simulators + internal distribution |
| Preview | `preview` | EAS Build + internal TestFlight/Firebase App Distribution |
| Staging | `staging` | EAS OTA update to staging channel |
| Production | `production` | EAS Submit to App Store Connect + Google Play Console |

**App packaging:**
- Expo EAS Build produces iOS `.ipa` and Android `.aab`.
- EAS Update for OTA JavaScript bundle updates (no app store review needed for JS-only changes).
- App version follows semver, build number auto-incremented.

**CI/CD (GitHub Actions):**

| Workflow | Trigger | Steps |
|----------|---------|-------|
| `pr.yml` | PR opened/sync | Lint, typecheck, unit tests |
| `eas-build.yml` | Push to main | Build iOS + Android via EAS, internal distribution |
| `eas-update.yml` | Push to main | OTA update to staging channel |
| `maestro-e2e.yml` | Schedule (nightly) | Maestro E2E on EAS-built app |

---

## 9. Architecture Decision Records (ADRs)

### ADR-001: Separate Frontend and Mobile Repositories

**Status:** ACCEPTED

**Context:** The BAC platform consists of four existing repos. The frontend and mobile layers could be (a) embedded in the backend repo (neuroforge-sdx), (b) placed in a single combined repo, or (c) separated into two repos.

**Decision:** Two separate repositories: AI-Frontend-Experience for web and AI-Companion-Mobile for mobile.

**Rationale:**
- The backend repo (neuroforge-sdx) is a Go monorepo with Go-specific tooling (golangci-lint, buf, Makefile). Mixing TypeScript/pnpm/Turborepo would create CI complexity and conflicting tooling concerns.
- Web and mobile have different build toolchains (Next.js/Turbopack vs Expo/Metro), different deployment targets (Kubernetes containers vs App Store/Play Store), and different release cadences.
- Shared code between web and mobile is handled through published `@bac/*` npm packages, providing clean versioned contracts.
- Separation enables independent CI/CD pipelines, independent scaling of teams, and independent release schedules.

**Consequences:**
- Must maintain published package pipeline for `@bac/*` packages.
- Proto type sync requires a scheduled CI job between neuroforge-sdx and AI-Frontend-Experience.

---

### ADR-002: Next.js 15 with App Router

**Status:** ACCEPTED

**Context:** The frontend needs SSR (docs SEO), real-time dashboards, API routes (BFF), and file-based routing. Alternatives considered: Remix, SvelteKit, Astro.

**Decision:** Next.js 15 with App Router.

**Rationale:**
- React Server Components reduce client bundle for data-heavy dashboard pages.
- API routes provide a natural BFF layer for auth proxying and SpiceDB permission checks.
- Turbopack offers fast builds.
- Largest ecosystem for React-based enterprise dashboards.
- App Router's nested layouts map perfectly to the authenticated shell + product area + sub-page pattern.
- The engineering package already specifies TypeScript + React (Next.js 15) as the frontend selection.

**Consequences:**
- Must learn App Router patterns (server/client component boundaries).
- Some libraries may not yet support RSC; use `"use client"` boundary where needed.

---

### ADR-003: React Native with Expo over Flutter

**Status:** ACCEPTED

**Context:** The mobile companion needs cross-platform iOS/Android. Considered: React Native (Expo), Flutter, native (Swift + Kotlin).

**Decision:** React Native with Expo SDK 52.

**Rationale:**
- **Code sharing is the decisive factor.** The AI-Frontend-Experience produces `@bac/api-clients` (Connect-ES TypeScript stubs), `@bac/auth` (JWT claim parsing, session hooks), `@bac/tokens` (design tokens), `@bac/config` (env schema, feature flags), and `@bac/observability` (OTel SDK). All are TypeScript packages. Flutter (Dart) cannot import these -- every package would need to be reimplemented in Dart, doubling maintenance burden and creating drift risk.
- Expo provides EAS Build (cloud builds), EAS Update (OTA), and Expo Router (file-based routing matching Next.js patterns).
- React Native's New Architecture (Fabric + TurboModules) closes the performance gap with Flutter.
- The team already uses TypeScript across the entire stack (Design-Factory_Figma, neuroforge-sdx generated stubs).

**Consequences:**
- Must use Tamagui or similar for native-feeling components (not web-only Radix).
- Some native modules may require native code (Kotlin/Swift) for edge cases.

---

### ADR-004: Authentik OIDC with next-auth and BFF Pattern

**Status:** ACCEPTED

**Context:** The platform uses Authentik for identity. The frontend must authenticate users and proxy authenticated requests to SDX and Hasura backends.

**Decision:** Use next-auth v5 with Authentik OIDC provider in a Backend-for-Frontend (BFF) pattern.

**Rationale:**
- Tokens are stored server-side in the BFF session (HTTP-only cookies), never exposed to client JavaScript.
- The BFF injects `Authorization: Bearer {token}`, `x-tenant-id`, `x-workspace-id` headers when proxying requests.
- SpiceDB permission checks happen in the BFF before proxying, preventing unauthorized API calls at the frontend boundary.
- JWT refresh happens server-side, invisible to the user.
- Matches the existing JWT claims structure: `sub`, `iss`, `aud`, `tenant_id`, `workspace_id`, `roles`, `exp`, `iat`.

**Consequences:**
- All API calls from the browser go through BFF proxy routes (`/api/proxy/sdx/`, `/api/proxy/hasura/`).
- Adds one network hop but prevents token leakage.
- Mobile app uses expo-auth-session with PKCE flow (tokens stored in secure storage, not BFF).

---

### ADR-005: Connect-ES for SDX API Client Generation

**Status:** ACCEPTED

**Context:** neuroforge-sdx already generates TypeScript Connect-ES stubs via `buf generate` (see `buf.gen.yaml` plugin `buf.build/connectrpc/es`). The frontend needs to consume these.

**Decision:** Use Connect-ES as the primary SDX API client, wrapped with TanStack Query hooks.

**Rationale:**
- The stubs already exist in `gen/typescript/sdx/v1/` -- using them avoids maintaining a separate client.
- Connect protocol supports both gRPC-Web (binary, efficient) and Connect (JSON, debuggable) over the same endpoints.
- Connect-ES has first-class TypeScript support with full type safety from proto definitions.
- TanStack Query wrapping provides caching, deduplication, optimistic updates, and suspense support.

**Consequences:**
- Must sync `gen/typescript/` from neuroforge-sdx on proto changes.
- BFF proxy must forward Connect protocol headers correctly.

---

### ADR-006: Design Token Pipeline from Design-Factory_Figma

**Status:** ACCEPTED

**Context:** Design tokens are produced by Design-Factory_Figma as JSON files conforming to `TokensSchema`. The frontend must consume these tokens for consistent styling.

**Decision:** Vendor token JSON files into `@bac/tokens` and transform them into Tailwind v4 preset (web) and Tamagui theme (mobile).

**Rationale:**
- Token schema is stable (`TokensSchema` in Design-Factory_Figma contracts): color, typography, spacing, radius, elevation, components.
- A transform layer (`packages/tokens/src/transform.ts`) maps token values to CSS custom properties and Tailwind theme extensions.
- Vendoring (copying) rather than depending at build time avoids coupling the frontend build to the Figma factory's availability.
- Both `enterprise.json` and `consumer.json` brand modes are supported.

**Consequences:**
- Token sync is a manual/scripted step (`scripts/sync-design-tokens.sh`), not automatic. Changes in Design-Factory_Figma require a sync + PR.
- The transform layer must be updated if `TokensSchema` evolves.

---

### ADR-007: Testing Strategy -- Vitest, Playwright, Storybook, Maestro

**Status:** ACCEPTED

**Context:** TDD is mandated by BAC platform rules. The frontend needs unit, component, integration, and E2E testing.

**Decision:**
- **Unit/Integration:** Vitest (web + shared packages), Jest (mobile app)
- **Component visual:** Storybook with Chromatic (web)
- **E2E web:** Playwright (multi-browser)
- **E2E mobile:** Maestro (cross-platform native flows)
- **API mocks:** MSW (Mock Service Worker) for all environments

**Rationale:**
- Vitest is faster than Jest for ESM-heavy TypeScript codebases and aligns with Design-Factory_Figma's choice.
- Playwright provides reliable cross-browser E2E with Trace Viewer for debugging.
- Storybook enables component development in isolation and visual regression testing.
- Maestro provides declarative YAML-based mobile E2E tests.
- MSW intercepts at the network level, enabling both test and development mocking of SDX and Hasura APIs.

**Test-first rule (per BAC CLAUDE.md):**
- Every new component: Storybook story + Vitest test FIRST.
- Every new page: Playwright test FIRST.
- Every new hook: Vitest test FIRST.
- Every new API integration: MSW handler + TanStack Query test FIRST.

---

### ADR-008: OpenTelemetry Frontend Observability

**Status:** ACCEPTED

**Context:** The platform uses OpenTelemetry everywhere (OTel -> Tempo/Mimir/Loki for SDX, VictoriaMetrics/Quickwit for platform). The frontend must participate in distributed traces.

**Decision:** Use `@opentelemetry/sdk-trace-web` and `@opentelemetry/sdk-metrics` in the frontend, exporting to the platform's OTel collector.

**Rationale:**
- Frontend traces are correlated with backend traces via W3C TraceContext propagation (`traceparent` header).
- Build correlation (`build_id` + `trace_id`) threads from the frontend through the BFF to the SDX backend.
- Web Vitals (LCP, FID, CLS) are exported as OTel metrics.
- Error boundary catches report exceptions as OTel spans.
- Structured JSON logging with `tenant_id`, `workspace_id`, `trace_id` matches the backend logging convention.

**Consequences:**
- OTel collector must accept browser-originated OTLP/HTTP exports (CORS configured).
- Bundle size impact (~15KB gzipped for OTel SDK).

---

### ADR-009: Trunk-Based Development with Preview Deploys

**Status:** ACCEPTED

**Context:** XP mandates small releases and continuous integration. The frontend needs a release strategy.

**Decision:** Trunk-based development on `main` with short-lived feature branches (max 1 day), preview deploys on PRs, and automated staging/production promotion.

**Rationale:**
- Matches BAC platform convention: every commit is a deployable unit.
- Preview deploys give reviewers a live URL per PR.
- Staging auto-deploys on every `main` merge.
- Production promotes via semver git tags.
- No long-lived release branches.

**Consequences:**
- Feature flags needed for incomplete features (via `@bac/config` feature flag client).
- Every PR must pass CI (lint, typecheck, test, build) before merge.

---

### ADR-010: BFF Pattern for Authorization Proxy

**Status:** ACCEPTED

**Context:** The frontend needs to call both SDX (Connect-ES/gRPC) and Platform (Hasura GraphQL / Rancher API) backends with proper auth and authorization.

**Decision:** Next.js API routes serve as a Backend-for-Frontend proxy. Every client-side API call goes through `/api/proxy/sdx/` or `/api/proxy/hasura/`.

**Rationale:**
- JWT tokens are never sent to the browser (HTTP-only session cookie only).
- The BFF performs SpiceDB permission checks before proxying, enforcing frontend authorization that matches the backend SpiceDB schema (`schema.zed`).
- The BFF handles JWT refresh transparently.
- A single origin avoids CORS complexity.
- The BFF can aggregate multiple backend calls into a single response for mobile-friendly endpoints.

**Consequences:**
- Adds latency (one extra hop).
- BFF becomes a potential bottleneck; mitigated by horizontal scaling and connection pooling.

---

### ADR-011: pnpm Workspaces + Turborepo Monorepo

**Status:** ACCEPTED

**Context:** The frontend repo contains multiple packages (`@bac/ui`, `@bac/tokens`, `@bac/api-clients`, etc.) and one app.

**Decision:** pnpm workspaces for dependency management, Turborepo for build orchestration.

**Rationale:**
- pnpm matches Design-Factory_Figma's package manager choice.
- Strict dependency management prevents phantom dependencies.
- Turborepo provides build caching (local + remote via S3), parallel execution, and dependency-aware task ordering.
- `turbo.json` defines the build pipeline: `build` depends on `^build` (package builds before app).

**Consequences:**
- All team members must use pnpm (enforced via `packageManager` field in root `package.json`).
- Remote caching requires S3 bucket or Turborepo cloud configuration.

---

### ADR-012: Hasura GraphQL Subscriptions via SSE

**Status:** ACCEPTED

**Context:** Platform data (workspace status, cluster health, promise state) changes in real-time. Hasura supports subscriptions over WebSocket and SSE.

**Decision:** Use Hasura subscriptions via Server-Sent Events (SSE) through the BFF proxy.

**Rationale:**
- SSE works through HTTP/2, which is simpler for load balancers and CDNs than WebSocket.
- The BFF can inject auth headers on the SSE connection, maintaining the security model.
- TanStack Query's `useQuery` with `refetchInterval` provides polling fallback.
- For the SDX real-time build status, Connect-ES server streaming is used instead (different protocol, same pattern).

**Consequences:**
- SSE is unidirectional (server to client); client-to-server mutations use regular GraphQL mutations.
- Must handle SSE reconnection on network interruptions.

---

## 10. Codex Handoff Package

### 10.1 Implementation Backlog -- Milestones M1-M8

#### M1: Foundation Scaffold (Week 1-2)

**Goal:** Repository scaffold, package structure, CI pipeline, auth flow, basic shell.

**Exit Criteria:** `pnpm build` succeeds. CI passes. Login flow works against Authentik. Empty authenticated shell renders.

| ID | Task | Acceptance Criteria | Deps | Est |
|----|------|---------------------|------|-----|
| M1-001 | Initialize AI-Frontend-Experience monorepo | `pnpm-workspace.yaml` with apps/web + 7 packages. `turbo.json` configured. `tsconfig.base.json` with strict mode. `.eslintrc.js` + `.prettierrc`. `Makefile` with lint, test, build, dev targets. | -- | S |
| M1-002 | Scaffold Next.js 15 app (App Router) | `apps/web/` with root layout, middleware, not-found, error pages. Tailwind v4 configured. App runs on `localhost:3000`. | M1-001 | S |
| M1-003 | Implement `@bac/tokens` package | Token transform from Design-Factory_Figma JSON to Tailwind preset + CSS vars. Both `enterprise.json` and `consumer.json` handled. Tests validate transform output. | M1-001 | M |
| M1-004 | Implement `@bac/config` package | Zod-validated environment schema. Region mappings (NexoRegion -> API base URL). Feature flag stub. Tests verify validation rejects invalid config. | M1-001 | S |
| M1-005 | Implement `@bac/auth` package | Session types, JWT claim parser (sub, tenant_id, workspace_id, roles), permission guard components, hooks (useSession, useTenant, useWorkspace). Tests for claim parsing and guard logic. | M1-001 | M |
| M1-006 | Configure next-auth with Authentik OIDC | Provider config in `apps/web/lib/auth.ts`. Callback route. Login/logout pages. Session cookie. JWT refresh. Test: login redirects to Authentik, callback stores session. | M1-002, M1-005 | M |
| M1-007 | Implement BFF proxy routes | `/api/proxy/sdx/[...path]` and `/api/proxy/hasura/[...path]` with JWT injection, tenant header injection, error normalization. Test with MSW stubs. | M1-006 | M |
| M1-008 | Implement authenticated shell layout | `(dashboard)/layout.tsx` with sidebar nav, tenant switcher, workspace switcher, user menu. Uses `@bac/tokens` for theming. Responsive (desktop sidebar, mobile hamburger). | M1-003, M1-006 | L |
| M1-009 | Implement `@bac/observability` package | OTel trace provider, Web Vitals metrics, structured JSON logger with tenant_id + trace_id. Tests verify span creation and metric recording. | M1-001 | M |
| M1-010 | Configure CI workflows | `pr.yml` (lint, typecheck, test, build), `push.yml` (+ container build + staging deploy). Turborepo remote caching. | M1-001 | M |

#### M2: API Client Layer (Week 3-4)

**Goal:** Generated API clients for SDX and Platform, wrapped with TanStack Query hooks.

**Exit Criteria:** `@bac/api-clients` package builds. SDX hooks return typed data from MSW stubs. Hasura hooks return typed data from MSW stubs.

| ID | Task | Acceptance Criteria | Deps | Est |
|----|------|---------------------|------|-----|
| M2-001 | Sync proto-generated TypeScript stubs | `scripts/sync-proto-types.sh` copies from neuroforge-sdx `gen/typescript/`. Stubs committed to `packages/api-clients/src/generated/sdx/`. All types importable. | M1-001 | S |
| M2-002 | Implement Connect-ES transport factory | `packages/api-clients/src/sdx/client.ts`: creates Connect transport with auth header interceptor, tenant context, base URL from `@bac/config`. Test: transport sends correct headers. | M2-001, M1-004 | M |
| M2-003 | Implement SDX TanStack Query hooks | One hook per SDXGatewayService RPC (17 hooks). `useWorkItems`, `useBuild`, `useArtifacts`, etc. Typed input/output from generated stubs. Cache keys follow `[service, method, params]` pattern. Tests verify cache behavior. | M2-002 | L |
| M2-004 | Configure graphql-codegen for Hasura | `codegen.ts` config: introspect Hasura schema, generate TypeScript types + typed document nodes. Output to `packages/api-clients/src/generated/platform/`. | M1-001 | M |
| M2-005 | Implement Hasura GraphQL hooks | `packages/api-clients/src/platform/hooks.ts`: TanStack Query hooks for workspace, cluster, promise, data-access operations. Subscription support via `useSubscription`. Tests with MSW GraphQL handlers. | M2-004 | L |
| M2-006 | Implement `@bac/testing` package | MSW handlers for all SDX RPCs and Hasura operations. Fixtures for tenants, builds, work items, clusters. Custom render with providers (TanStack QueryClient, auth context). | M2-003, M2-005 | M |

#### M3: Software Factory UI (Week 5-7)

**Goal:** Complete SDX web application -- work items, builds, pipeline visualization, gates, artifacts, agents.

| ID | Task | Acceptance Criteria | Deps | Est |
|----|------|---------------------|------|-----|
| M3-001 | SDX Overview page | `/software-factory` with active build count, agent utilization chart, recent completions, pipeline success rate. | M2-003 | L |
| M3-002 | Work Item CRUD pages | List (paginated, filterable), detail (requirements, ambiguities, manifest), new (submission form). End-to-end flow: submit -> parse -> resolve ambiguity -> approve. | M2-003 | XL |
| M3-003 | Build list and detail pages | List (filterable by status, date range), detail (overview, timeline, current stage). Real-time status update via polling/streaming. | M2-003 | L |
| M3-004 | Pipeline visualization | `/software-factory/builds/[buildId]/pipeline`: 16-stage interactive pipeline graph (D3 or React Flow). Color-coded by status. Click to expand stage details. | M3-003 | XL |
| M3-005 | Gate results page | `/software-factory/builds/[buildId]/gates`: 14 quality gates with pass/fail indicators, metric values, thresholds, remediation history. | M2-003 | L |
| M3-006 | Artifact registry and detail | List with search. Detail: signature verification status, provenance, SBOM viewer, deployment history. Download link generation. | M2-003 | L |
| M3-007 | Agent mesh dashboard | Grid of agents with status (IDLE/ASSIGNED/PROCESSING/UNHEALTHY), model config, current assignment, heartbeat indicator. | M2-003 | M |
| M3-008 | Code review UI | Diff viewer with compliance annotations, approval workflow, gate badges. | M2-003 | L |
| M3-009 | Compliance dashboard | Framework coverage matrix, control mapping, evidence download. Per-build compliance view. | M2-003 | L |
| M3-010 | SDX Analytics | Build metrics over time, cost tracking, agent utilization trends, gate pass rates. Chart components from `@bac/ui`. | M2-003 | M |
| M3-011 | Webhook management | CRUD for webhooks, delivery log viewer, test button. | M2-003 | M |

#### M4: Platform Automation UI (Week 8-10)

**Goal:** Complete platform web application -- clusters, workspaces, promises, observability, fleet.

| ID | Task | Acceptance Criteria | Deps | Est |
|----|------|---------------------|------|-----|
| M4-001 | Platform overview page | `/platform` with cluster topology map, region health, promise utilization stats. | M2-005 | L |
| M4-002 | Cluster pages | List by region, detail with node status, workload count, Fleet sync, storage. | M2-005 | L |
| M4-003 | Workspace pages | List with tenant class, detail with members, quotas, claimed promises, network policies. | M2-005 | L |
| M4-004 | Promise catalog | Self-service catalog with claim forms. Promise detail with CRD spec, existing claims. | M2-005 | XL |
| M4-005 | Fleet dashboard | Bundle sync status, drift detection alerts, GitRepo status. | M2-005 | M |
| M4-006 | GraphQL Explorer | Interactive GraphiQL-like IDE connected to workspace's Hasura endpoint. Schema explorer, query builder, response viewer. | M2-005 | XL |
| M4-007 | Observability pages | Metrics (Grafana embed or custom charts), traces (Tempo embed), logs (search + filter), alerts (active alerts, silence). | M2-005 | XL |
| M4-008 | Network topology | ClusterMesh visualization, Cilium policy viewer. | M2-005 | M |
| M4-009 | Platform compliance | CIS benchmark results, Kyverno policy status, Trivy scan reports. | M2-005 | M |

#### M5: Admin, Settings, Docs (Week 11-12)

| ID | Task | Acceptance Criteria | Deps | Est |
|----|------|---------------------|------|-----|
| M5-001 | Admin tenant management | Tenant CRUD, plan management, suspension, compliance profile. PLATFORM_ADMIN only. | M2-003 | L |
| M5-002 | Admin user management | User list, role assignment, SSO status. | M2-005 | M |
| M5-003 | Admin billing dashboard | Billing meters per tenant, cost charts, usage export. | M2-003 | M |
| M5-004 | Admin audit log | Hash-chain verified audit trail, filters (date, user, action, resource), export. | M2-003 | L |
| M5-005 | User settings pages | Profile, workspace settings, API key management, notification preferences, integrations. | M2-003 | M |
| M5-006 | Docs site (Fumadocs) | MDX content structure, search, navigation. Initial content: getting started, architecture overview. | M1-008 | L |
| M5-007 | API Explorer | SDX Swagger/Connect UI + Platform GraphiQL. Interactive, authenticated. | M2-003, M2-005 | L |

#### M6: Mobile Companion App (Week 13-16)

| ID | Task | Acceptance Criteria | Deps | Est |
|----|------|---------------------|------|-----|
| M6-001 | Initialize AI-Companion-Mobile repo | Expo SDK 52, Expo Router, Tamagui, pnpm workspace. CI with EAS Build. | -- | M |
| M6-002 | Mobile auth flow | Authentik OIDC PKCE via expo-auth-session + biometric unlock via expo-local-authentication. | M6-001 | L |
| M6-003 | Integrate `@bac/*` shared packages | Install `@bac/api-clients`, `@bac/auth`, `@bac/tokens`, `@bac/config` from GitHub Packages. Verify all imports resolve. | M6-001 | M |
| M6-004 | Dashboard home tab | KPI cards, build summary, cluster health, cost tracker. Pull-to-refresh. | M6-003 | L |
| M6-005 | Alerts tab | Alert feed with severity filters, detail view, acknowledge action. | M6-003 | L |
| M6-006 | Approvals tab | Approval queue, detail view, approve/reject with comment. | M6-003 | L |
| M6-007 | Push notifications | expo-notifications + FCM/APNs. All 10 notification categories. Deep link handling. | M6-003 | L |
| M6-008 | Build and work item screens | List + detail for builds and work items. Quick work item submission. | M6-003 | M |
| M6-009 | Incident response screens | Incident list, detail, acknowledge, runbook viewer. | M6-003 | M |
| M6-010 | Cluster and workspace screens | Cluster list + detail, workspace detail. | M6-003 | M |
| M6-011 | Settings tab | Profile, workspace selector, notification preferences, about. | M6-003 | M |
| M6-012 | Maestro E2E tests | Login, approve build, view alerts, incident response flows. | M6-004..M6-011 | L |

#### M7: Integration Testing & Hardening (Week 17-18)

| ID | Task | Acceptance Criteria | Deps | Est |
|----|------|---------------------|------|-----|
| M7-001 | Playwright E2E suite (web) | Full user journeys: login -> submit work item -> view build -> check gates -> download artifact. | M3, M4, M5 | XL |
| M7-002 | Cross-browser testing | Chrome, Firefox, Safari, Edge. All Playwright tests pass. | M7-001 | M |
| M7-003 | Accessibility audit | WCAG 2.1 AA compliance. Axe-core integration in CI. All critical pages pass. | M3, M4, M5 | L |
| M7-004 | Performance optimization | Lighthouse scores: Performance >= 90, Accessibility >= 95, Best Practices >= 95. Bundle analysis, code splitting, image optimization. | M3, M4, M5 | L |
| M7-005 | Security hardening | CSP headers, CSRF protection, XSS prevention, dependency audit (npm audit). | M3, M4, M5 | M |
| M7-006 | Mobile E2E hardening | Maestro tests pass on iOS 17+ and Android 14+. | M6 | M |
| M7-007 | OTel integration verification | Frontend traces appear in Tempo, linked to backend traces. Web Vitals in Mimir. | M1-009 | M |

#### M8: Production Readiness (Week 19-20)

| ID | Task | Acceptance Criteria | Deps | Est |
|----|------|---------------------|------|-----|
| M8-001 | Production Kubernetes manifests | Deployment, Service, Ingress, HPA, PDB, NetworkPolicy. Fleet GitRepo configured. | M7 | L |
| M8-002 | Multi-region deployment verification | App accessible from ng-prod, za-prod, eu-prod. CDN cache warm. | M8-001 | M |
| M8-003 | Runbook documentation | Deployment, rollback, incident response, monitoring runbooks. | M8-001 | M |
| M8-004 | App store submission preparation | iOS App Store Connect + Google Play Console setup. Screenshots, metadata, privacy policy. | M6 | L |
| M8-005 | Load testing | k6 load test: 500 concurrent users on dashboard, p99 < 2s. | M8-001 | M |
| M8-006 | Final security scan | Container scan (Trivy), dependency audit, SBOM generation. | M8-001 | M |

### 10.2 Acceptance Criteria (Top-Level)

| ID | Criterion | Verification |
|----|-----------|-------------|
| AC-01 | Authenticated user can submit a work item via web UI and see it in the work item list | E2E test |
| AC-02 | Build pipeline visualization shows all 16 stages with real-time status | E2E test |
| AC-03 | Quality gate results display pass/fail with metric values and thresholds | E2E test |
| AC-04 | Artifact detail shows Cosign signature verification, SLSA provenance, SBOM | E2E test |
| AC-05 | Platform cluster topology renders all regions and clusters | E2E test |
| AC-06 | Promise catalog allows self-service claim submission | E2E test |
| AC-07 | GraphQL Explorer connects to workspace's Hasura endpoint and executes queries | E2E test |
| AC-08 | Audit log displays hash-chain verified entries with filters | E2E test |
| AC-09 | Mobile push notification navigates to correct screen on tap | Maestro E2E |
| AC-10 | Mobile approval flow allows approve/reject with comment | Maestro E2E |
| AC-11 | Tenant A cannot see Tenant B's data in the UI | Security test |
| AC-12 | JWT tokens are never accessible in browser JavaScript (HTTP-only cookies) | Security test |
| AC-13 | All pages meet WCAG 2.1 AA accessibility requirements | Axe-core audit |
| AC-14 | Lighthouse Performance score >= 90 on dashboard page | Performance test |
| AC-15 | Frontend OTel traces are correlated with backend traces in Tempo | Integration test |
| AC-16 | Design tokens from Design-Factory_Figma are correctly applied across all components | Visual regression |
| AC-17 | CI fails if generated API types drift from proto/Hasura schema | CI pipeline test |
| AC-18 | Mobile app receives OTA updates without app store resubmission | EAS Update test |
| AC-19 | SpiceDB permission checks prevent unauthorized route access | E2E test |
| AC-20 | Feature flags gate incomplete features without code branches | Integration test |

### 10.3 Exact Files to Create First (M1-001)

**AI-Frontend-Experience:**
1. `package.json` (root: name, engines, packageManager, scripts)
2. `pnpm-workspace.yaml` (apps/\*, packages/\*)
3. `turbo.json` (pipeline config: build, lint, test, typecheck)
4. `tsconfig.base.json` (strict, ES2022, moduleResolution bundler)
5. `.eslintrc.js` (flat config, TypeScript, React)
6. `.prettierrc` (semi: true, singleQuote: true, trailingComma: all)
7. `.gitignore` (node_modules, dist, .next, .turbo, .env.local)
8. `Makefile` (dev, build, lint, test, typecheck, clean targets)
9. `.env.example` (BAC\_AUTH\_URL, BAC\_SDX\_API\_URL, BAC\_HASURA\_URL, etc.)
10. `apps/web/package.json` (next, react, tailwindcss, etc.)
11. `apps/web/next.config.ts`
12. `apps/web/tailwind.config.ts`
13. `apps/web/tsconfig.json`
14. `apps/web/app/layout.tsx` (root layout)
15. `packages/tokens/package.json`
16. `packages/config/package.json`
17. `packages/auth/package.json`
18. `packages/api-clients/package.json`
19. `packages/ui/package.json`
20. `packages/observability/package.json`
21. `packages/testing/package.json`

**AI-Companion-Mobile:**
1. `package.json` (root)
2. `pnpm-workspace.yaml`
3. `apps/mobile/package.json` (expo, expo-router, tamagui)
4. `apps/mobile/app.config.ts`
5. `apps/mobile/app/_layout.tsx`
6. `apps/mobile/eas.json`
7. `packages/mobile-ui/package.json`

---

### Critical Files for Implementation

- `/Users/AbiolaOgunsakin1/Workflows/AI-Software-Factory/neuroforge-sdx/gen/typescript/sdx/v1/gateway_connect.ts` -- The generated Connect-ES stubs that `@bac/api-clients` wraps; defines the entire SDX API surface consumed by the frontend
- `/Users/AbiolaOgunsakin1/Workflows/Design-Factory_Figma/packages/contracts/src/schemas/tokens.ts` -- The `TokensSchema` Zod definition that `@bac/tokens` must conform to when transforming design tokens
- `/Users/AbiolaOgunsakin1/Workflows/AI Platform Automation/architecture/identity/spicedb/schema.zed` -- The SpiceDB authorization schema that the frontend BFF must enforce; defines all permission relationships (workspace, promise, data_access, etc.)
- `/Users/AbiolaOgunsakin1/Workflows/AI-Software-Factory/neuroforge-sdx/api/proto/sdx/v1/common.proto` -- Shared enums (PlanTier, NexoRegion, LanguageCode, ComplianceFramework, AgentType) and value objects consumed across all frontend pages
- `/Users/AbiolaOgunsakin1/Workflows/AI Platform Automation/bac-platform/platform/kratix/promises/data-access-hasura.yaml` -- The Hasura promise CRD that defines how GraphQL endpoints are provisioned; the frontend must render claim forms matching this schema