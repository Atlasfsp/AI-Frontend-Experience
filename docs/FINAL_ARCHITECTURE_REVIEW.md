# BAC Ecosystem — Final Architecture Review

**Date:** 2026-03-23
**Reviewer:** Principal Architect, StratoGroup
**Scope:** 6-repository ecosystem final compliance audit
**Status:** APPROVED WITH CONDITIONS

---

## 1. Architecture Compliance Verdict

### Overall: APPROVED — 3-Layer Architecture Preserved

The 6-repository ecosystem maintains correct layer separation, correct ownership boundaries, and correct contract flow direction.

| Layer | Repos | Verdict | Evidence |
|-------|-------|---------|----------|
| **Design** | Stitch, Figma | ✅ COMPLIANT | Stitch produces explorations → Figma converges to production-intent tokens, route maps, component specs. No runtime coupling between them. Handoff pack is the explicit interface. |
| **Backend/Control** | Software Factory, Platform Automation | ✅ COMPLIANT | Each publishes OpenAPI 3.1 + Protobuf contracts. Both use Go, Helm, Fleet. Completely independent release cadences. Connected only via NATS JetStream events. |
| **Experience** | Frontend Experience, Companion Mobile | ✅ COMPLIANT | Both consume upstream contracts via `contracts/upstreams/`. Neither imports backend source code. Web uses `@bac/*` namespace, mobile uses `@bac-mobile/*`. No cross-import between them. |

### Layer Communication Compliance

| Flow | Expected | Actual | Status |
|------|----------|--------|--------|
| Design → Experience | Tokens + route maps + component specs via GitHub Release artifacts | `contracts/upstreams/design-factory-figma/` synced in both experience repos | ✅ |
| Backend → Experience | OpenAPI + Proto specs via GitHub Release artifacts | `contracts/upstreams/ai-software-factory/` and `ai-platform-automation/` synced in both experience repos | ✅ |
| Experience → Backend | HTTP/gRPC/GraphQL runtime calls | BFF proxy routes in web apps (`/api/proxy/sdx/`, `/api/proxy/hasura/`). REST hooks in mobile. | ✅ |
| Stitch → Figma | Concept inventory + screen maps via handoff packs | `exports/concept-inventory/` and `handoffs/exploratory-prompts/` present in Stitch with manifests consumed by Figma | ✅ |
| Experience ↛ Experience | No runtime coupling | Web and mobile share no imports, no runtime calls, no shared packages | ✅ |
| Experience ↛ Design | No reverse flow | Experience repos do not publish back to design repos | ✅ |

### Invariant Rule Compliance

| Rule | Status |
|------|--------|
| Design repos never call backend APIs | ✅ Confirmed — Stitch is markdown/Python, Figma is Fastify+Temporal internal only |
| Experience repos never write to backend databases | ✅ Confirmed — all mutations flow through BFF proxy → backend API |
| Backend repos never import frontend code | ✅ Confirmed — contract artifacts are the only coupling |
| Stitch never produces production-intent designs | ✅ Confirmed — outputs are explorations, not tokens/specs |
| Mobile never replicates full web functionality | ✅ Confirmed — mobile is quick-action companion only |
| Web never bundles mobile-specific code | ✅ Confirmed — separate pnpm workspaces, separate package namespaces |

---

## 2. Must-Fix Before Release

These items block a production release. Each has been verified against the current codebase.

### MF-01: API Client Codegen Is Still a Stub (P0)

**Location:** Both repos — `scripts/integration/generate-client-bindings.mjs`
**Evidence:** The script generates only `contract-registry.ts` (a list of endpoint paths). It does not generate typed TypeScript HTTP clients from the OpenAPI specs. Both repos have OpenAPI JSON specs synced in `contracts/upstreams/` but no actual typed functions, request/response interfaces, or Zod validators are generated from them.
**Impact:** All query hooks in `@bac/api-clients` and `@bac-mobile/api-mobile-clients` return mock data only. There is no code path from mock to live API that doesn't require manual client implementation.
**Fix:** Wire `openapi-typescript` (or `openapi-zod-client`) into `generate-client-bindings.mjs` to produce typed fetch wrappers from the synced OpenAPI specs. Replace mock data with generated client calls behind a feature flag (`mockApi`).
**Effort:** 3 days (both repos).

### MF-02: Sentry DSN Not Provisioned — Errors Are Silent (P0)

**Location:** Both repos — `packages/observability/src/sentry.ts`
**Evidence:** Web `@bac/observability` imports `@sentry/nextjs` but the DSN is empty string by default. Mobile `@bac-mobile/observability` imports `@sentry/react-native` with the same gap. Both `initSentry()` functions guard against missing DSN but log to console only, meaning production errors will be invisible.
**Impact:** Any runtime crash in production will be untracked. No alerting, no error grouping, no stack trace capture.
**Fix:** Create Sentry projects for `bac-software-factory-web`, `bac-platform-automation-web`, `bac-docs-portal`, and `bac-companion-mobile`. Set DSNs via environment variables (`NEXT_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_BAC_SENTRY_DSN`).
**Effort:** 0.5 day.

### MF-03: No Production Health Check in Platform Web (P0)

**Location:** `apps/platform-automation-web/`
**Evidence:** Software Factory has `/api/health` route, but Platform Automation Web does not have a health endpoint. The Dockerfile health check (`curl localhost:3000/api/health`) will fail for this app.
**Impact:** Kubernetes liveness/readiness probes will fail for Platform Automation Web, causing CrashLoopBackOff in production.
**Fix:** Add `apps/platform-automation-web/app/api/health/route.ts` matching the Software Factory pattern.
**Effort:** 15 minutes.

### MF-04: EAS Configuration Partially Complete (P1)

**Location:** `AI-Companion-Mobile/apps/operator-mobile/eas.json`
**Evidence:** The file exists with build profiles (development, preview, staging, production) and submit configs. However, `EXPO_PUBLIC_BAC_EAS_PROJECT_ID` defaults to `'bac-companion-mobile-preview'` in `app.config.ts` — this is a placeholder, not a real EAS project ID.
**Impact:** EAS Build will fail in CI until a real project is created via `eas init`.
**Fix:** Run `eas init` to create the project, then update the environment variable in CI secrets.
**Effort:** 30 minutes.

### MF-05: Web Docker Build Arg Mismatch (P1)

**Location:** `AI-Frontend-Experience/Dockerfile`
**Evidence:** Dockerfile uses `ARG APP_NAME` and builds `@bac/${APP_NAME}`. But the Turbo filter `--filter=@bac/${APP_NAME}` requires the package name to match exactly. The package names are `@bac/software-factory-web`, `@bac/platform-automation-web`, and `@bac/docs-portal`. This means `APP_NAME` must be the full package suffix, not just the app directory name.
**Impact:** Docker build will fail if `APP_NAME=software-factory-web` is passed but the Turbo filter expects the full `@bac/software-factory-web`.
**Fix:** Verify the Dockerfile's `turbo prune` and `turbo run build` commands use `--filter=@bac/${APP_NAME}` and that the `docker.yml` workflow passes the correct values.
**Effort:** 30 minutes.

### MF-06: Integration Workflow Uses `--no-frozen-lockfile` (P1)

**Location:** Both repos — `.github/workflows/integration.yml`
**Evidence:** The integration workflow uses `pnpm install` without `--frozen-lockfile`, with a comment saying "INTENTIONAL for CI." This is incorrect — CI should always use frozen lockfile to ensure reproducible builds. The integration sync should not modify lockfiles.
**Impact:** Integration CI could produce different dependency trees than development, causing phantom build failures.
**Fix:** Change to `pnpm install --frozen-lockfile` in integration.yml. If contract sync adds new dependencies, those should be committed via a separate PR.
**Effort:** 15 minutes.

### MF-07: Mobile App Icons and Splash Assets Missing (P1)

**Location:** `AI-Companion-Mobile/apps/operator-mobile/app.config.ts`
**Evidence:** No `icon`, `splash`, or `adaptiveIcon` properties in the Expo config. EAS Build for production will produce an app with default Expo icons.
**Impact:** App Store / Google Play submission will be rejected without proper branding assets.
**Fix:** Add icon assets (1024x1024 PNG for iOS, adaptive icon for Android) and splash screen. Reference them in `app.config.ts`.
**Effort:** 1 day (requires design asset delivery).

---

## 3. Should-Fix After Release

These items improve quality and maintainability but do not block the initial production release.

### SF-01: Unify Semantic Release Configuration

**Current state:** Web uses `conventionalcommits` preset; mobile uses `angular` preset. Both produce correct semver bumps but different changelog formats.
**Fix:** Standardize on `conventionalcommits` preset in both `.releaserc.json` files. This matches the commit convention already used across both repos.

### SF-02: Wire Real OpenAPI Client Generation

**Current state:** `generate-client-bindings.mjs` produces only a registry. Query hooks return mock data.
**Fix:** After MF-01, replace all mock `queryFn` implementations with generated client calls behind the `mockApi` feature flag. This means:
- When `mockApi=true` → return mock data (current behavior)
- When `mockApi=false` → call generated typed client

### SF-03: Add Playwright E2E to Web

**Current state:** Web has no E2E test suite. Only unit tests via Vitest.
**Fix:** Add Playwright tests for critical flows: login → dashboard → navigation → detail view → action. Run in CI on PR against staging.

### SF-04: Complete i18n String Extraction

**Current state:** Both repos have i18n packages with en/fr/pt locale files, but strings are hardcoded in most components.
**Fix:** Extract all user-facing strings to locale files. Wire `useTranslation()` (mobile) and `useI18n()` (web) into all components.

### SF-05: Add Visual Regression Testing to Web

**Current state:** Storybook exists with stories for 4+ components, but no visual regression CI.
**Fix:** Integrate Chromatic or Percy for Storybook visual regression on every PR.

### SF-06: Harden WebSocket Reconnection

**Current state:** `packages/api-clients/src/websocket.ts` exists but is a placeholder.
**Fix:** Implement reconnection with exponential backoff, heartbeat, and connection state indicators in the UI.

### SF-07: Add Bundle Size Budgets

**Current state:** `bundle-analysis.yml` measures but doesn't enforce.
**Fix:** Add size budgets to `bundle-analysis.yml` (e.g., main chunk < 200KB, vendor < 500KB). Fail PR if exceeded.

### SF-08: Implement Feature Flag Admin Surface

**Current state:** Feature flags are environment-variable-driven. No admin UI.
**Fix:** Add `/admin/feature-flags` route to Software Factory Web with toggle controls backed by a feature flag service API.

### SF-09: Mobile Offline Mutation Queue

**Current state:** `offlinePersistence` feature flag exists. Query cache persists. But mutations (approve, acknowledge) are not queued offline.
**Fix:** Implement mutation queue in `@bac-mobile/api-mobile-clients` that stores mutations in AsyncStorage and replays on reconnect.

### SF-10: Tablet Layout Polish

**Current state:** `tablet-layout.tsx` and `responsive.ts` exist in mobile. Tablet detection works.
**Fix:** Audit all 31 mobile screens for tablet layout support. Add master-detail split views for list → detail screens (alerts, incidents, builds).

### SF-11: Consolidate Design Token Sync Scripts

**Current state:** Web has `scripts/sync-design-tokens.sh` (stub). Mobile has `scripts/sync-design-tokens.sh` (stub). Both also have `scripts/integration/validate-design-drift.mjs` (working).
**Fix:** Remove the shell script stubs. Consolidate token sync into `sync-upstreams.mjs` which already handles all upstream artifact types.

### SF-12: Add SBOM Generation to Experience Repos

**Current state:** Software Factory has `sbom.yml`. Experience repos do not.
**Fix:** Add `cyclonedx-npm` to CI pipeline for both experience repos. Publish SBOMs alongside container images.

---

## 4. Final Release Coordination Model

### Release Sequence

Releases must flow in this order to preserve contract compatibility:

```
PHASE 1: Backend contracts (parallel)
  AI-Software-Factory  ──tag──>  contracts/software-factory-*/v1.x.x
  AI-Platform-Automation ─tag──> contracts/platform-automation-*/v1.x.x

PHASE 2: Design contracts (parallel with Phase 1)
  Design-Factory_Figma ──tag──>  handoff/figma-*/v1.x.x

PHASE 3: Experience consumers (after Phase 1+2)
  AI-Frontend-Experience:
    1. Pull new contracts (sync-upstreams.mjs)
    2. Regenerate clients (generate-client-bindings.mjs)
    3. Validate compatibility (validate-contract-drift.mjs)
    4. Run full CI (lint + typecheck + test + build)
    5. Tag release: v1.x.x
    6. Build Docker images
    7. Deploy to staging
    8. Smoke test staging
    9. Promote to production

  AI-Companion-Mobile:
    1. Pull new contracts (sync-upstreams.mjs)
    2. Regenerate clients (generate-client-bindings.mjs)
    3. Validate compatibility
    4. Run full CI
    5. Tag release: v1.x.x
    6. EAS Build (staging profile)
    7. TestFlight / Firebase App Distribution
    8. Smoke test staging
    9. EAS Build (production profile)
    10. App Store / Google Play submission
```

### Release Compatibility Rules

| Rule | Enforcement |
|------|-------------|
| Backend releases MUST publish contract artifacts before experience repos consume them | `integration.yml` fails if upstream tag doesn't exist |
| Experience repos MUST pin to `^major.minor` ranges | `compatibility/manifest.json` enforced in CI |
| Breaking backend changes (major bump) require coordinated release | Cannot auto-update — creates GitHub Issue instead |
| Design token changes require validation in both experience repos | `validate-design-drift.mjs` runs in both CIs |
| Web and mobile release independently | No cross-dependency between experience repos |

### Rollback Protocol

| Layer | Rollback Mechanism | Time to Rollback |
|-------|-------------------|------------------|
| Web | Redeploy previous Docker image via Fleet | < 5 minutes |
| Mobile (OTA) | Revert EAS Update branch | < 2 minutes |
| Mobile (native) | Resubmit previous build to stores | 24-48 hours (store review) |
| Backend | Helm rollback via Fleet | < 5 minutes |
| Design tokens | Revert to previous token release tag | < 10 minutes (requires experience repo redeploy) |

---

## 5. Governance Model

### Review Authority Matrix

| Change Type | Required Reviewer(s) | Approval Count | Merge Policy |
|------------|----------------------|----------------|-------------|
| App route/screen | App team lead | 1 | Squash merge |
| Shared package (`@bac/*` or `@bac-mobile/*`) | Package owner + 1 consumer team member | 2 | Squash merge |
| Contract artifact update | Architecture lead + 1 consumer team member | 2 | Squash merge |
| Auth/security change | Security lead | 2 | Squash merge |
| Design token change | Design engineering lead + architecture lead | 2 | Squash merge |
| CI/CD workflow change | DevOps lead + architecture lead | 2 | Squash merge |
| Breaking change (major version) | Architecture lead + all affected team leads | 3 | Merge commit (preserves history) |
| Governance doc change | Architecture lead | 1 | Squash merge |
| ADR creation/update | Architecture lead | 1 | Squash merge |

### Branch Policy

| Branch | Protection Rules |
|--------|-----------------|
| `main` | Require PR. Require CI pass. Require 1+ approval. No force push. No direct push. |
| `feat/*`, `fix/*`, `chore/*` | No protection. Developer-managed. |
| `contracts/*` | Require architecture review. Require 2 approvals. |
| `release/*` | Require 2 approvals. Require all CI gates green. |

### Commit Convention (All 6 Repos)

```
<type>(<scope>): <description>

Types: feat, fix, perf, refactor, docs, chore, test, ci, build
Scopes: app-specific (e.g., sdx-web, platform-web, docs, mobile)
         or package-specific (e.g., auth, api-clients, ui, config)
         or cross-cutting (e.g., contracts, ci, deps)
```

### Quality Gate Enforcement

| Gate | PR | Pre-merge | Release |
|------|----|-----------| --------|
| Lint (ESLint/golint) | ✅ | ✅ | ✅ |
| Type check (tsc/go vet) | ✅ | ✅ | ✅ |
| Unit tests | ✅ | ✅ | ✅ |
| Contract validation | ✅ | ✅ | ✅ |
| Design token validation | ✅ | ✅ | ✅ |
| Bundle analysis | ✅ (web only) | — | ✅ |
| Accessibility audit | ✅ (web only) | — | ✅ |
| E2E tests | — | — | ✅ |
| Security scan | — | ✅ | ✅ |
| Performance budget | — | — | ✅ |

---

## 6. Ownership Model

### Repo Ownership

| Repository | Owning Team | Lead | Deployment Authority |
|-----------|------------|------|---------------------|
| AI-Software-Factory | Software Engineering | SDX Tech Lead | SDX Tech Lead + Architecture |
| AI-Platform-Automation | Platform Engineering | Platform Tech Lead | Platform Tech Lead + Architecture |
| Design-Factory_Stitch | Design (Exploration) | Design Director | Design Director |
| Design-Factory_Figma | Design (Production) | Design Engineering Lead | Design Engineering Lead + Architecture |
| AI-Frontend-Experience | Frontend Engineering | Frontend Tech Lead | Frontend Tech Lead |
| AI-Companion-Mobile | Mobile Engineering | Mobile Tech Lead | Mobile Tech Lead |

### Contract Artifact Ownership

| Artifact | Owning Repo | Owning Team | Consumer Repos |
|----------|------------|-------------|----------------|
| `software-factory-openapi` | AI-Software-Factory | Software Engineering | Frontend, Mobile |
| `software-factory-proto` | AI-Software-Factory | Software Engineering | Frontend |
| `software-factory-connect-typescript` | AI-Software-Factory | Software Engineering | Frontend |
| `platform-automation-openapi` | AI-Platform-Automation | Platform Engineering | Frontend, Mobile |
| `figma-design-tokens` | Design-Factory_Figma | Design Engineering | Frontend, Mobile |
| `figma-web-route-map` | Design-Factory_Figma | Design Engineering | Frontend |
| `figma-mobile-route-map` | Design-Factory_Figma | Design Engineering | Mobile |
| `figma-component-specs-web` | Design-Factory_Figma | Design Engineering | Frontend |
| `figma-component-specs-mobile` | Design-Factory_Figma | Design Engineering | Mobile |
| `stitch-concept-inventory` | Design-Factory_Stitch | Design (Exploration) | Figma |
| `stitch-screen-maps` | Design-Factory_Stitch | Design (Exploration) | Figma, Frontend |

### Package Ownership (Experience Layer)

**AI-Frontend-Experience:**

| Package | Owner | Escalation |
|---------|-------|-----------|
| `@bac/ui` | Design Engineering | Frontend Tech Lead |
| `@bac/design-tokens` | Design Engineering | Architecture |
| `@bac/auth` | Security Frontend | Architecture |
| `@bac/api-clients` | API Team | Frontend Tech Lead |
| `@bac/config` | Frontend Leads | Architecture |
| `@bac/observability` | SRE Frontend | Architecture |
| `@bac/domain-contracts` | Architecture | Principal Architect |
| `@bac/i18n` | Frontend Leads | — |
| `@bac/testing` | Frontend Leads | — |
| `@bac/eslint-config` | Frontend Leads | — |
| `@bac/tsconfig` | Frontend Leads | — |

**AI-Companion-Mobile:**

| Package | Owner | Escalation |
|---------|-------|-----------|
| `@bac-mobile/ui-mobile` | Design Engineering | Mobile Tech Lead |
| `@bac-mobile/auth-mobile` | Security Mobile | Architecture |
| `@bac-mobile/api-mobile-clients` | API Team | Mobile Tech Lead |
| `@bac-mobile/config` | Mobile Leads | Architecture |
| `@bac-mobile/observability` | SRE Mobile | Architecture |
| `@bac-mobile/i18n-mobile` | Mobile Leads | — |
| `@bac-mobile/testing` | Mobile Leads | — |

### Incident Escalation

| Severity | First Responder | Escalation | Decision Authority |
|----------|----------------|------------|-------------------|
| P0 (outage) | On-call SRE | Tech Lead → Architecture → CTO | Architecture |
| P1 (degraded) | Owning team | Tech Lead | Tech Lead |
| P2 (non-urgent) | Owning team | — | Team |
| P3 (improvement) | Any engineer | — | Team |

---

## 7. Next-Phase Backlog

### Phase 1: Production Hardening (Weeks 1-2)

| # | Item | Repo | Owner | Effort |
|---|------|------|-------|--------|
| 1 | Wire OpenAPI client codegen (MF-01) | Both | API Team | 3d |
| 2 | Provision Sentry projects (MF-02) | Both | SRE | 0.5d |
| 3 | Add health endpoint to Platform Web (MF-03) | Web | Frontend | 15m |
| 4 | Initialize EAS project (MF-04) | Mobile | Mobile | 30m |
| 5 | Validate Docker build arg flow (MF-05) | Web | DevOps | 30m |
| 6 | Fix integration CI lockfile (MF-06) | Both | DevOps | 15m |
| 7 | Add app icons and splash (MF-07) | Mobile | Design | 1d |

### Phase 2: Testing Infrastructure (Weeks 3-4)

| # | Item | Repo | Owner | Effort |
|---|------|------|-------|--------|
| 8 | Playwright E2E for web critical flows (SF-03) | Web | Frontend | 3d |
| 9 | Complete Maestro E2E in CI | Mobile | Mobile | 2d |
| 10 | Visual regression with Chromatic (SF-05) | Web | Design Eng | 2d |
| 11 | Bundle size budgets (SF-07) | Web | Frontend | 0.5d |
| 12 | SBOM generation (SF-12) | Both | DevOps | 1d |

### Phase 3: Production Readiness (Weeks 5-6)

| # | Item | Repo | Owner | Effort |
|---|------|------|-------|--------|
| 13 | Wire live API clients behind feature flag (SF-02) | Both | API Team | 3d |
| 14 | WebSocket reconnection (SF-06) | Web | Frontend | 2d |
| 15 | Mobile offline mutation queue (SF-09) | Mobile | Mobile | 2d |
| 16 | Staging deployment dry-run | Both | DevOps | 1d |
| 17 | Security dependency audit | Both | Security | 1d |
| 18 | Performance benchmarks (Lighthouse CI) | Web | Frontend | 1d |

### Phase 4: Polish (Weeks 7-8)

| # | Item | Repo | Owner | Effort |
|---|------|------|-------|--------|
| 19 | i18n string extraction (SF-04) | Both | Frontend + Mobile | 3d |
| 20 | Tablet layout audit (SF-10) | Mobile | Mobile | 3d |
| 21 | Feature flag admin UI (SF-08) | Web | Frontend | 2d |
| 22 | Consolidate token sync scripts (SF-11) | Both | DevOps | 0.5d |
| 23 | Unify .releaserc presets (SF-01) | Both | DevOps | 15m |
| 24 | Health check dashboard route | Web | Frontend | 1d |

### Phase 5: Scale Preparation (Weeks 9-10)

| # | Item | Repo | Owner | Effort |
|---|------|------|-------|--------|
| 25 | GraphQL subscription real-time integration | Web | Frontend | 3d |
| 26 | Push notification E2E with FCM/APNs | Mobile | Mobile | 2d |
| 27 | Multi-tenant workspace switcher (live API) | Both | API Team | 2d |
| 28 | Canary deployment configuration | Web | DevOps | 1d |
| 29 | Load testing (k6) for web BFF proxies | Web | SRE | 2d |
| 30 | App Store / Play Store submission preparation | Mobile | Mobile | 2d |

---

## 8. ADR Updates

### ADR-018: OpenAPI Client Generation Strategy

**Status:** Proposed
**Context:** `generate-client-bindings.mjs` currently produces only an endpoint registry, not typed clients. All data hooks return mock data.
**Decision:** Wire `openapi-typescript` to generate TypeScript interfaces from synced OpenAPI specs. Wire `openapi-fetch` to create typed HTTP clients. Maintain mock data behind `mockApi` feature flag.
**Consequences:** Query hooks will have two code paths: mock (development) and live (staging/production). Generated types will be the single source of truth for request/response shapes, replacing manually authored Zod schemas where specs exist.

### ADR-019: Unified Changelog Preset

**Status:** Proposed
**Context:** Web uses `conventionalcommits` preset; mobile uses `angular` preset. Both produce semver but with different changelog formats.
**Decision:** Standardize on `conventionalcommits` preset across all 6 repos.
**Consequences:** Consistent changelog format. Consistent release note generation. Same commit parsing rules everywhere.

### ADR-020: Health Check Endpoint Standard

**Status:** Proposed
**Context:** Software Factory Web has `/api/health`. Platform Automation Web does not. Docs Portal does not. Docker HEALTHCHECK depends on this endpoint.
**Decision:** Every deployable web app MUST expose `GET /api/health` returning `{ status: "ok", version: string, uptime: number }`.
**Consequences:** Kubernetes liveness/readiness probes work consistently. Docker HEALTHCHECK works for all apps. Monitoring can scrape health endpoints uniformly.

### ADR-021: Mock-to-Live Feature Flag Pattern

**Status:** Proposed
**Context:** Both experience repos support mock-mode development via `mockApi` feature flag. Transitioning to live APIs requires a clear pattern.
**Decision:** Every query hook checks `useFeatureFlag('mockApi')`. When true, return mock data. When false, call generated typed client. The feature flag is environment-driven: `true` in development, `false` in staging/production.
**Consequences:** Development never hits real APIs. Staging always hits real APIs. Production always hits real APIs. Mock data remains available for testing and demos.

### ADR-022: Cross-Repo Release Sequence

**Status:** Proposed
**Context:** Backend and design repos publish contracts. Experience repos consume them. Release order matters for compatibility.
**Decision:** Release sequence: Backend/Design (Phase 1, parallel) → Experience (Phase 2, after contracts published). Experience repos auto-detect new upstream releases via `integration.yml` and create PRs.
**Consequences:** No breaking changes reach experience repos unexpectedly. Compatibility matrix validates before merge. Breaking upstream changes create Issues, not PRs.

---

## 9. Long-Term Scaling Notes

### Adding a New Product to the Ecosystem

When a new BAC product is introduced (e.g., "AI-Compliance-Engine"):

1. **Backend:** Create `AI-Compliance-Engine/` repo following the Go hexagonal template. Publish OpenAPI + Proto contracts via GitHub Release.
2. **Design:** Add `compliance-engine/` directories under both Stitch (prompts/) and Figma (prompts/, handoff/) for product-specific design work.
3. **Web:** Add `apps/compliance-engine-web/` to `AI-Frontend-Experience`. The monorepo pattern supports unlimited apps with shared packages.
4. **Mobile:** Add screen routes under `apps/operator-mobile/app/compliance/` in `AI-Companion-Mobile`. No new app needed.
5. **Contracts:** Add `contracts/upstreams/ai-compliance-engine/` to both experience repos. Update `compatibility/manifest.json`.
6. **CI:** No workflow changes needed. Turbo handles new app automatically. Integration workflow syncs new upstream automatically.

### Scaling Teams

| Scale Point | Current | Next Stage | Action Required |
|-------------|---------|-----------|----------------|
| 1 frontend team | Monorepo works well | 2-3 teams | Add CODEOWNERS per app. No repo split needed. |
| 1 mobile team | Single app works well | 2 teams | Split by domain (SDX screens vs Platform screens). No repo split needed. |
| 5+ web apps | Turbo handles dependency graph | 10+ apps | Consider micro-frontend architecture with Module Federation. |
| 10+ backend services | Current 2-repo split is correct | 10+ | Each service gets its own repo. Contract registry becomes a dedicated service. |
| Multi-region deployment | Config supports 3 regions | 10+ regions | Move region config to platform control plane API. Experience repos fetch at runtime. |

### Technology Refresh Points

| Technology | Current Version | End-of-Life Risk | Migration Path |
|-----------|----------------|-----------------|----------------|
| Next.js 15 | Stable | Low (18-month cycle) | Incremental upgrade via `next.config.ts` |
| React 19 | Stable | Very low | Follow React upgrade guide |
| Expo 52 | Stable | Low (yearly SDK) | `expo upgrade` handles most changes |
| React Native 0.76 | Stable | Low | Follow RN upgrade helper |
| Tamagui 1.x | Stable | Medium (smaller maintainer base) | Consider NativeWind if Tamagui stalls |
| TanStack Query 5 | Stable | Very low | Incremental |
| pnpm 9 | Stable | Low | Direct upgrade |
| Turborepo | Stable (Vercel-backed) | Very low | Direct upgrade |
| Sentry | Stable | Very low | SDK upgrade |

### Shared Package Extraction Timeline

If the ecosystem grows to 10+ products, consider extracting shared packages to a dedicated `BAC-Platform-SDK` repo:

| Phase | Packages to Extract | Trigger |
|-------|-------------------|---------|
| Now | None — keep in experience repos | Current scale is correct |
| 5+ products | `@bac/domain-contracts`, `@bac/auth` | When 3+ repos need the same types |
| 10+ products | `@bac/ui`, `@bac/design-tokens` | When design system serves external consumers |
| Enterprise SDK | All `@bac/*` packages | When third-party developers build on BAC |

### Design System Scaling

| Current | Next | Trigger |
|---------|------|---------|
| 27 web components, 14 mobile components | 50+ web, 30+ mobile | When new products need domain-specific components |
| 4 themes (enterprise/consumer × dark/light) | 8+ themes | When partner brands or white-labeling is required |
| Manual Storybook | Automated Storybook publishing | When external stakeholders review components |
| Per-repo tokens | Centralized token service | When 3+ experience repos consume tokens |

---

*End of Final Architecture Review*
*Version 1.0.0 — 2026-03-23*
*StratoGroup — BAC Platform Architecture*
