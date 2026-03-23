# Architecture Review — AI-Frontend-Experience & AI-Companion-Mobile

> **Date:** 2026-03-23
> **Reviewer:** Principal Architect
> **Classification:** CONFIDENTIAL — ENGINEERING REVIEW
> **Scope:** Post-Codex implementation review of both frontend repositories
> **Verdict:** CONDITIONALLY APPROVED — 14 must-fix items before release

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Verdict](#2-architecture-verdict)
3. [Repository Boundary Assessment](#3-repository-boundary-assessment)
4. [Architecture Drift Report](#4-architecture-drift-report)
5. [Implementation Weakness Analysis](#5-implementation-weakness-analysis)
6. [Must-Fix Before Release](#6-must-fix-before-release)
7. [Post-Release Improvements](#7-post-release-improvements)
8. [Cleanup / Refactor Plan](#8-cleanup--refactor-plan)
9. [Next Milestone Backlog (M9–M12)](#9-next-milestone-backlog-m9m12)
10. [Merge and Release Guidance](#10-merge-and-release-guidance)
11. [Appendix A — Cross-Repo Drift Matrix](#appendix-a--cross-repo-drift-matrix)
12. [Appendix B — File Inventory Summary](#appendix-b--file-inventory-summary)

---

## 1. Executive Summary

Both repositories have been scaffolded to a production-grade baseline. The monorepo structure, CI pipelines, auth flows, mock-first data layer, design token system, and documentation are all present and well-organized. The Codex implementation delivered approximately 85% of the M1–M4 milestones from the original architecture package.

**However, critical architecture drift has occurred between the two repositories.** The role systems, permission models, design token strategies, and domain type definitions have diverged in ways that will cause integration failures if not corrected before release. This review identifies 14 must-fix items and 18 post-release improvements.

### Scorecard

| Dimension | AI-Frontend-Experience | AI-Companion-Mobile |
|-----------|----------------------|---------------------|
| Repo boundaries | ✅ Correct | ✅ Correct |
| Route/screen structure | ✅ Complete | ✅ Complete (52 screens) |
| Shared package strategy | ⚠️ Good, missing cross-repo | ⚠️ Good, missing cross-repo |
| Design token strategy | ✅ Dual-mode (consumer/enterprise) | ❌ Single dark theme only |
| API client strategy | ⚠️ Mock-first, no codegen wired | ⚠️ Mock-first, no codegen wired |
| Auth/session structure | ✅ OIDC + HMAC cookies | ⚠️ OIDC + SecureStore (role drift) |
| Docs readiness | ✅ Excellent | ✅ Excellent |
| CI/CD | ✅ 4-gate quality | ✅ 4-gate quality |
| Long-term scalability | ⚠️ Needs shared contracts | ⚠️ Needs shared contracts |
| Deployment readiness | ⚠️ No Dockerfile | ⚠️ No EAS credentials |

---

## 2. Architecture Verdict

### CONDITIONALLY APPROVED

The foundational architecture is sound. Both repositories follow the BAC platform principles (XP, TDD, DDD, AIDD) and are structured for enterprise scale. The conditional approval requires resolution of the 14 must-fix items documented in Section 6 before any production release.

**What's right:**
- Clean monorepo discipline (pnpm + Turborepo in both)
- Strict TypeScript throughout (exact optional properties, no unchecked index access)
- Mock-first seams enabling full-stack UI development without backends
- BFF proxy pattern in web for token forwarding and audit enrichment
- Expo Router file-based navigation mirroring Next.js App Router mental model
- Comprehensive documentation (architecture, local dev, release, onboarding)
- Role-aware navigation with permission filtering
- 4-gate CI quality (lint → typecheck → test → build)

**What's wrong:**
- Role definitions diverged between web and mobile (5 vs 6 roles, different names)
- Mobile has zero permission enforcement (role-only access)
- Design tokens not shared — mobile hardcodes values instead of consuming from source
- No shared types package across repositories
- No Dockerfile in web repo
- No EAS credentials provisioned for mobile
- API client codegen configured but not wired to real specs
- No E2E test infrastructure in mobile

---

## 3. Repository Boundary Assessment

### AI-Frontend-Experience — CORRECT

| Concern | Assessment |
|---------|-----------|
| Owns all web UI for BAC platform | ✅ Three apps: software-factory-web, platform-automation-web, docs-portal |
| Shared design system | ✅ @bac/ui with 29+ components |
| Shared API explorer | ✅ Swagger route in software-factory-web |
| Admin/operator/tenant dashboards | ✅ Role-filtered navigation per app |
| Does NOT contain backend logic | ✅ Only BFF proxy routes |
| Does NOT contain mobile code | ✅ Clean boundary |

### AI-Companion-Mobile — CORRECT

| Concern | Assessment |
|---------|-----------|
| Owns all mobile companion UX | ✅ Single operator-mobile app |
| Notifications, approvals, alerts | ✅ Tab navigation + deep stacks |
| Incident response | ✅ Dedicated incident screens |
| Lightweight control-plane actions | ✅ Quick actions with action receipts |
| Executive summaries | ✅ Dashboard with role-aware briefings |
| Does NOT contain web code | ✅ Clean boundary |
| Does NOT duplicate backend logic | ✅ Mock-first data layer only |

### Boundary Verdict: CORRECT

The two-repo split is justified. Web and mobile have different:
- Build toolchains (Next.js vs Expo)
- Deployment targets (container vs app store)
- Release cadences (preview deploy vs TestFlight)
- CI requirements (Playwright vs Maestro)
- Team scaling paths (web specialists vs mobile specialists)

---

## 4. Architecture Drift Report

### 4.1 CRITICAL — Role System Divergence

**Web roles (5):**
```
VIEWER → MEMBER → ADMIN → PLATFORM_ADMIN → OPERATOR
```

**Mobile roles (6):**
```
OPERATOR, ADMIN, APPROVER, EXECUTIVE, SUPPORT_ENGINEER, COMPLIANCE_REVIEWER
```

**Impact:** A user authenticated via Authentik will receive JWT claims with role names. If the web and mobile apps interpret different role strings, the same user will have different access levels across platforms. This is a production-blocking defect.

**Root cause:** The mobile repo introduced operational personas (APPROVER, EXECUTIVE, SUPPORT_ENGINEER, COMPLIANCE_REVIEWER) that the web repo doesn't recognize. Meanwhile, the web repo has hierarchical roles (VIEWER, MEMBER) that the mobile repo doesn't recognize.

**Resolution:** Create a unified role taxonomy:
```
VIEWER, MEMBER, ADMIN, PLATFORM_ADMIN, OPERATOR    (from web — hierarchy)
APPROVER, EXECUTIVE, SUPPORT_ENGINEER, COMPLIANCE_REVIEWER  (from mobile — personas)
```
Both repos must recognize all 9 roles. Authentik issues the canonical set. Each repo filters to the roles it surfaces in its UX.

### 4.2 CRITICAL — Permission Model Gap

**Web:** 21 fine-grained SpiceDB permissions mapped to roles via permission matrix.
**Mobile:** Zero permissions. Pure role-based access only.

**Impact:** Mobile approvers can approve anything regardless of workspace scope. Mobile admins have no guardrails on destructive actions. This violates the SpiceDB authorization model that the BAC platform is built on.

**Resolution:** Port the web permission matrix to the mobile auth package. At minimum, mobile mutations (approve, acknowledge, workspace action) must check permissions before executing.

### 4.3 HIGH — Design Token Divergence

**Web:** Dual-mode tokens (consumer + enterprise) consumed from JSON files with CSS variable generation.
**Mobile:** Single hardcoded dark theme in tamagui.ts with no consumer mode.

**Impact:** BAC products targeting consumer markets will render correctly on web but have wrong branding on mobile. Token values were manually copied rather than synced from Design-Factory_Figma.

**Resolution:**
1. Add `sync-design-tokens.sh` to mobile repo
2. Generate Tamagui token config from the same JSON source as web
3. Support both consumer and enterprise themes in mobile

### 4.4 HIGH — Domain Type Divergence

**Web types:**
```typescript
SoftwareFactoryOverview, PlatformOverview, BuildSummary,
WorkItemSummary, AgentSummary, ClusterSummary, WorkspaceSummary,
PromiseSummary, SwaggerDocument
```

**Mobile types:**
```typescript
DashboardSummary, DashboardMetric, DashboardShortcut, DashboardBriefing,
AlertItem, ApprovalItem, IncidentItem, WorkItem, BuildSummary,
QuickAction, ActionReceipt, CompanionRole
```

**Impact:** When backend APIs ship, both frontends will consume the same Hasura/SDX responses. If the type shapes don't align, one or both frontends will break on integration.

**Resolution:** Extract canonical domain types into a shared package published to both repos. Mobile adds mobile-specific presentation types that extend the canonical types.

### 4.5 MEDIUM — Session Schema Structural Differences

**Web:** `BacSession` — roles array, HMAC-signed cookies, no biometric fields.
**Mobile:** `MobileSession` — activeRole tracking, biometric lock, session confirmation, SecureStore.

**Assessment:** These differences are JUSTIFIED. Web sessions are stateless cookies; mobile sessions require device-level security. The structural differences are correct. However, the core identity fields (subject, email, tenantId, workspaceId, roles) must share a common base type.

---

## 5. Implementation Weakness Analysis

### 5.1 No Shared Types Package

Both repos define their own domain types. There is no `@bac/types` or `@bac/contracts` package that provides the single source of truth. This is the highest-risk architectural weakness because it guarantees drift as features evolve.

**Severity:** HIGH
**Effort:** 2 days

### 5.2 API Client Codegen Not Wired

Both repos have codegen configuration files (`openapi.config.ts`, `graphql-codegen.ts`) but they are scaffolds. No actual OpenAPI spec or GraphQL schema is consumed. When backends ship real APIs, the transition from mock to generated clients will be manual and error-prone.

**Severity:** HIGH
**Effort:** 3 days (depends on backend spec availability)

### 5.3 No Dockerfile in Web Repo

AI-Frontend-Experience has no Dockerfile. The release workflow validates but does not package. For Kubernetes deployment via the BAC GitOps model, containerized builds are required.

**Severity:** HIGH
**Effort:** 1 day

### 5.4 No EAS Credentials in Mobile Repo

AI-Companion-Mobile has EAS config scaffolded but no credentials provisioned. Preview builds and App Store submissions are blocked until Apple Developer and Google Play signing certificates are configured.

**Severity:** HIGH
**Effort:** 1 day (provisioning), ongoing (certificate management)

### 5.5 No E2E Test Infrastructure in Mobile

Web repo has Playwright configured for 3 browsers. Mobile repo references Maestro in architecture docs but has no Maestro flows, no Detox config, and no E2E workflow.

**Severity:** MEDIUM
**Effort:** 3 days

### 5.6 No Error Tracking Integration

Both repos reference Sentry/OpenObserve in config but neither has actual error tracking wired. The observability package in web has a logger and tracer but no error reporting client. Mobile has a Sentry DSN env var but no Sentry SDK in dependencies.

**Severity:** MEDIUM
**Effort:** 2 days

### 5.7 Mobile Missing Multi-Region Support

Web config defines 3 regions (ng, za, eu) with per-region API base URLs. Mobile config has a single `apiBaseUrl` with no region awareness.

**Severity:** MEDIUM
**Effort:** 1 day

### 5.8 No Token Refresh Flow

Web auth has OIDC PKCE with token exchange but no silent refresh implementation. Mobile stores refresh tokens in SecureStore but has no refresh flow. Both apps will force re-login when access tokens expire (default 1 hour).

**Severity:** MEDIUM
**Effort:** 2 days

### 5.9 Web Missing Zustand Implementation

Web lists Zustand as a dependency for client ephemeral state but no store is defined anywhere. All state management runs through TanStack Query server state. This is not necessarily a weakness — it may indicate Zustand isn't needed yet — but it's dead weight in the dependency tree.

**Severity:** LOW
**Effort:** 0.5 day (remove or implement)

### 5.10 Mobile Missing Light Theme

Mobile only defines `bacDark` theme. The app config says `userInterfaceStyle: 'automatic'` which implies OS-level light/dark switching, but there is no light theme to switch to.

**Severity:** LOW
**Effort:** 1 day

---

## 6. Must-Fix Before Release

These 14 items must be resolved before any production deployment.

### P0 — Production Blockers

| # | Item | Repo | Effort | Description |
|---|------|------|--------|-------------|
| 1 | **Unify role taxonomy** | Both | 2d | Create canonical role enum recognized by both repos. Map all 9 roles (5 web + 4 mobile-only) into a shared definition. Both repos must parse the full set from JWT claims. |
| 2 | **Add mobile permission matrix** | Mobile | 2d | Port the web permission matrix to `@bac-mobile/auth-mobile`. All mutations (approve, acknowledge, workspace action) must check permissions. |
| 3 | **Extract shared domain types** | Both | 2d | Create `@bac/domain-types` package (or a contract repo) with canonical interfaces for BuildSummary, WorkItem, Cluster, Workspace, Alert, Approval, Incident. Both repos import from this source. |
| 4 | **Add Dockerfile to web repo** | Web | 1d | Multi-stage Dockerfile: Node 20 Alpine base → pnpm install → turbo build → standalone Next.js output. One Dockerfile per app with build args for app selection. |
| 5 | **Provision EAS credentials** | Mobile | 1d | Configure Apple Developer signing cert + Google Play upload key. Wire into `preview-build.yml` workflow. |
| 6 | **Add token refresh flow** | Both | 2d | Web: silent refresh via `/api/auth/refresh` route using refresh token. Mobile: background refresh via `expo-auth-session` token refresh with SecureStore persistence. |

### P1 — Release Quality Gates

| # | Item | Repo | Effort | Description |
|---|------|------|--------|-------------|
| 7 | **Sync mobile design tokens from source** | Mobile | 1d | Add `sync-design-tokens.sh` mirroring web pattern. Generate Tamagui config from Design-Factory_Figma JSON. |
| 8 | **Add consumer theme to mobile** | Mobile | 1d | Generate consumer Tamagui theme from consumer.json tokens. Support theme switching. |
| 9 | **Add multi-region support to mobile** | Mobile | 1d | Port region config from web `@bac/config`. Mobile `apiBaseUrl` must be region-aware. |
| 10 | **Wire error tracking** | Both | 2d | Web: add Sentry SDK to `@bac/observability`, wire to error boundary. Mobile: add `sentry-expo` to operator-mobile, configure DSN. |
| 11 | **Add mobile E2E test framework** | Mobile | 2d | Add Maestro flows for login → dashboard → approve → alert acknowledge. Wire into CI as a separate job. |
| 12 | **Add mobile light theme** | Mobile | 1d | Define `bacLight` Tamagui theme. Wire to `userInterfaceStyle: 'automatic'` so OS preference is respected. |
| 13 | **Remove unused Zustand from web** | Web | 0.5d | Either implement a legitimate client store (command palette state, sidebar collapse) or remove the dependency. |
| 14 | **Add pnpm-lock.yaml to CI** | Both | 0.5d | Switch from `--no-frozen-lockfile` to `--frozen-lockfile` in all CI workflows. Commit lock files. Current CI installs are non-deterministic. |

**Total estimated effort: ~21 engineering days**

---

## 7. Post-Release Improvements

These 18 items improve quality, performance, and developer experience but are not release blockers.

| # | Item | Repo | Priority | Description |
|---|------|------|----------|-------------|
| 1 | Wire OpenAPI codegen to real SDX spec | Both | HIGH | Replace mock clients with generated TypeScript from OpenAPI spec |
| 2 | Wire GraphQL codegen to real Hasura schema | Web | HIGH | Generate typed hooks from Hasura introspection |
| 3 | Add Storybook for @bac/ui | Web | HIGH | Visual component catalog, interaction testing, design review |
| 4 | Add preview deployment workflow | Web | HIGH | Vercel/Cloudflare preview per PR with environment isolation |
| 5 | Add semantic-release to both repos | Both | HIGH | Automated versioning, changelog, GitHub releases |
| 6 | Add bundle analysis | Web | MEDIUM | Track JS bundle size per app, alert on regression |
| 7 | Add performance monitoring | Both | MEDIUM | Core Web Vitals (web), app startup time (mobile) |
| 8 | Add accessibility audit workflow | Web | MEDIUM | axe-core CI integration for WCAG 2.1 AA compliance |
| 9 | Add push notification E2E test | Mobile | MEDIUM | Test deep-link routing from notification tap |
| 10 | Add offline persistence | Mobile | MEDIUM | TanStack Query persistent storage for true offline-first |
| 11 | Add WebSocket reconnection logic | Web | MEDIUM | Auto-reconnect for Hasura subscriptions on network drop |
| 12 | Add i18n framework | Both | MEDIUM | Internationalization support (next-intl for web, i18next for mobile) |
| 13 | Add feature flag service integration | Both | LOW | Replace static feature flags with LaunchDarkly/Unleash |
| 14 | Add health check dashboard | Web | LOW | /admin/health route showing all upstream dependency status |
| 15 | Add dark mode toggle to web | Web | LOW | Web currently only uses design tokens for theming, no user-facing toggle |
| 16 | Add tablet layout support | Mobile | LOW | Responsive layouts for iPad/Android tablet form factors |
| 17 | Add biometric prompt customization | Mobile | LOW | Per-role biometric messaging and fallback flows |
| 18 | Add CI build caching | Both | LOW | Turborepo remote cache for faster CI builds |

---

## 8. Cleanup / Refactor Plan

### Phase 1 — Contract Unification (Week 1)

**Goal:** Eliminate cross-repo drift by establishing shared contracts.

```
Step 1: Create @bac/domain-contracts package
  Location: New shared package (npm registry or git submodule)
  Contents:
    - roles.ts        → Canonical BacRole enum (all 9 roles)
    - permissions.ts   → Canonical BacPermission enum (21+ permissions)
    - session-base.ts  → Common session fields (subject, email, tenantId, workspaceId, roles)
    - domain/
      - build.ts       → BuildSummary canonical type
      - work-item.ts   → WorkItemSummary canonical type
      - cluster.ts     → ClusterSummary canonical type
      - workspace.ts   → WorkspaceSummary canonical type
      - alert.ts       → AlertItem canonical type
      - approval.ts    → ApprovalItem canonical type
      - incident.ts    → IncidentItem canonical type

Step 2: Refactor AI-Frontend-Experience
  - Import roles, permissions, session-base from @bac/domain-contracts
  - Remove local role/permission definitions from @bac/auth
  - Update @bac/api-clients/types.ts to extend canonical types

Step 3: Refactor AI-Companion-Mobile
  - Import roles, permissions, session-base from @bac/domain-contracts
  - Remove local role definitions from @bac-mobile/auth-mobile
  - Add permission matrix to @bac-mobile/auth-mobile
  - Update @bac-mobile/api-mobile-clients/types.ts to extend canonical types
```

### Phase 2 — Token Alignment (Week 1)

**Goal:** Mobile consumes the same design token source as web.

```
Step 1: Add scripts/sync-design-tokens.sh to mobile repo
  Source: Design-Factory_Figma/data/tokens/
  Target: packages/ui-mobile/src/tokens/

Step 2: Create token transformer
  Input: consumer.json, enterprise.json
  Output: Tamagui-compatible token config

Step 3: Generate both themes
  bacLight (consumer + enterprise light variants)
  bacDark  (consumer + enterprise dark variants)

Step 4: Wire theme switcher to OS preference + user override
```

### Phase 3 — Infrastructure Hardening (Week 2)

**Goal:** Both repos are deployable with deterministic builds.

```
Step 1: Add Dockerfile to AI-Frontend-Experience
  - Multi-stage: deps → build → runtime
  - Build arg for app selection (software-factory|platform|docs)
  - Standalone Next.js output mode
  - Health check endpoint exposed

Step 2: Provision EAS credentials for AI-Companion-Mobile
  - Apple Developer team enrollment
  - Google Play Console service account
  - EAS secret store configuration
  - Wire preview-build.yml to actually invoke eas build

Step 3: Lock CI dependency resolution
  - Commit pnpm-lock.yaml to both repos
  - Switch all workflows from --no-frozen-lockfile to --frozen-lockfile

Step 4: Add token refresh flows
  - Web: /api/auth/refresh route with refresh_token grant
  - Mobile: expo-auth-session TokenResponse.refreshAsync()
```

### Phase 4 — Quality Infrastructure (Week 2–3)

**Goal:** Automated quality enforcement beyond lint/typecheck/test/build.

```
Step 1: Add Sentry to both repos
  - Web: @sentry/nextjs in each app
  - Mobile: sentry-expo in operator-mobile
  - Wire to @bac/observability error boundary

Step 2: Add Maestro E2E to mobile
  - Flow: login → dashboard → alerts → approve → settings
  - CI job: maestro-cloud or local emulator in GitHub Actions

Step 3: Add Storybook to web
  - @bac/ui component stories
  - Chromatic visual regression (optional)

Step 4: Remove dead dependencies
  - Web: remove zustand if unused, or implement command palette store
```

---

## 9. Next Milestone Backlog (M9–M12)

### M9 — Contract Unification & Infrastructure (2 weeks)

| Task | Type | Effort | Acceptance Criteria |
|------|------|--------|-------------------|
| Create @bac/domain-contracts package | Architecture | 3d | Package published, both repos import successfully |
| Unify role taxonomy across repos | Architecture | 2d | Single BacRole enum with 9 roles parsed from JWT in both repos |
| Add permission matrix to mobile | Feature | 2d | All mobile mutations check permissions before execution |
| Add Dockerfile to web repo | Infrastructure | 1d | `docker build --build-arg APP=software-factory-web` produces running container |
| Provision EAS credentials | Infrastructure | 1d | `eas build --profile preview` succeeds |
| Lock CI with frozen lockfile | Infrastructure | 0.5d | All CI workflows use `--frozen-lockfile` |

### M10 — Design System Convergence (2 weeks)

| Task | Type | Effort | Acceptance Criteria |
|------|------|--------|-------------------|
| Add token sync script to mobile | Infrastructure | 1d | `pnpm sync:tokens` generates Tamagui config from Figma source |
| Add consumer + enterprise themes to mobile | Feature | 2d | Both themes render correctly on iOS and Android |
| Add light theme to mobile | Feature | 1d | OS preference toggles between bacLight and bacDark |
| Add Storybook to web @bac/ui | DX | 2d | All 29+ components have stories with controls |
| Add token refresh flow (web) | Feature | 1d | Session persists beyond access token expiry via silent refresh |
| Add token refresh flow (mobile) | Feature | 1d | Background refresh keeps session alive without user intervention |

### M11 — Live API Integration (3 weeks)

| Task | Type | Effort | Acceptance Criteria |
|------|------|--------|-------------------|
| Wire OpenAPI codegen to SDX spec | Integration | 2d | `pnpm sync:openapi && pnpm codegen` produces typed clients |
| Wire GraphQL codegen to Hasura | Integration | 2d | `pnpm codegen:graphql` produces typed hooks |
| Replace mock data with live API calls | Integration | 5d | Software factory dashboard renders live data from SDX |
| Wire Hasura subscriptions for real-time | Feature | 2d | Platform dashboard shows live cluster status |
| Add BFF proxy routes for mobile | Feature | 2d | Mobile API calls route through web BFF for token forwarding |
| Integration test suite | Testing | 3d | E2E tests pass against staging environment |

### M12 — Production Readiness (2 weeks)

| Task | Type | Effort | Acceptance Criteria |
|------|------|--------|-------------------|
| Add Sentry error tracking | Observability | 2d | Errors surface in Sentry dashboard within 30 seconds |
| Add Maestro E2E to mobile CI | Testing | 2d | Maestro flows pass in CI on every PR |
| Add preview deployment workflow | Infrastructure | 2d | Every PR gets a preview URL with isolated environment |
| Add semantic-release | Infrastructure | 1d | Merge to main triggers version bump, changelog, GitHub release |
| Add bundle analysis | Performance | 1d | Bundle size reported on every PR, regression alerts configured |
| Production smoke test suite | Testing | 2d | Post-deploy verification for auth, dashboard, API proxy |
| Security audit | Security | 2d | OWASP top 10 check, dependency vulnerability scan |

---

## 10. Merge and Release Guidance

### Branch Strategy

```
main (protected)
  └── feat/* (feature branches)
  └── fix/* (bug fixes)
  └── chore/* (infrastructure)
  └── release/* (release candidates)
```

Both repos use the same strategy. All changes go through PR with 4-gate CI.

### Release Process

#### AI-Frontend-Experience

```
1. All P0 must-fix items resolved
2. Create release branch: release/v0.2.0
3. CI passes (lint + typecheck + test + build)
4. Build Docker images for all 3 apps
5. Deploy to staging environment
6. Run smoke tests against staging
7. Promote to production
8. Tag: v0.2.0
9. Merge release branch back to main
```

**Docker build command (per app):**
```bash
docker build \
  --build-arg APP=software-factory-web \
  --build-arg NODE_ENV=production \
  -t bac-software-factory-web:v0.2.0 .
```

**Deployment targets:**
- software-factory-web → software-factory.bac.example.com
- platform-automation-web → platform.bac.example.com
- docs-portal → docs.bac.example.com

#### AI-Companion-Mobile

```
1. All P0 must-fix items resolved
2. Create release branch: release/v0.2.0
3. CI passes (lint + typecheck + test + build)
4. EAS preview build → internal TestFlight / Firebase App Distribution
5. QA on physical devices (iOS + Android)
6. EAS production build
7. Submit to App Store Connect + Google Play Console
8. Tag: v0.2.0
9. Merge release branch back to main
```

**EAS build commands:**
```bash
eas build --profile preview --platform all   # internal testing
eas build --profile production --platform all # store submission
eas submit --profile production --platform all # store upload
```

### Pre-Release Checklist

- [ ] Unified role taxonomy deployed to Authentik
- [ ] Permission matrix ported to mobile
- [ ] Design tokens synced from Figma source
- [ ] Token refresh flows tested (web + mobile)
- [ ] Dockerfile builds all 3 web apps successfully
- [ ] EAS builds both iOS and Android
- [ ] CI uses frozen lockfile
- [ ] Error tracking configured (Sentry DSN set)
- [ ] Environment variables documented and populated for staging
- [ ] Smoke tests pass on staging
- [ ] No critical/high Dependabot alerts open
- [ ] ARCHITECTURE.md updated with any changes from this review

### GitOps Integration

Both repos produce artifacts consumed by the BAC GitOps pipeline:

```
AI-Frontend-Experience
  → Docker images → pushed to container registry
  → Kubernetes manifests in AI-Platform-Automation
  → ArgoCD syncs to target cluster

AI-Companion-Mobile
  → EAS builds → pushed to app stores
  → OTA updates via expo-updates (future)
  → No Kubernetes involvement
```

---

## Appendix A — Cross-Repo Drift Matrix

| Domain | Web Value | Mobile Value | Status | Fix Priority |
|--------|-----------|-------------|--------|-------------|
| **Roles** | VIEWER, MEMBER, ADMIN, PLATFORM_ADMIN, OPERATOR | OPERATOR, ADMIN, APPROVER, EXECUTIVE, SUPPORT_ENGINEER, COMPLIANCE_REVIEWER | ❌ CRITICAL DRIFT | P0 |
| **Permissions** | 21 fine-grained (SpiceDB-aligned) | None (role-only) | ❌ CRITICAL DRIFT | P0 |
| **Primary Color** | Enterprise: #1f5eff, Consumer: #005f73 | #1f5eff (enterprise only) | ⚠️ PARTIAL DRIFT | P1 |
| **Heading Font** | Space Grotesk (enterprise), Fraunces (consumer) | Space Grotesk only | ⚠️ PARTIAL DRIFT | P1 |
| **Typography Scale** | rem-based (0.75rem–2.5rem) | pixel-based (14px–28px) | ⚠️ UNIT DRIFT | P2 |
| **Session Schema** | BacSession (roles[], cookie-based) | MobileSession (activeRole, SecureStore) | ✅ JUSTIFIED | — |
| **Auth Mode** | HMAC-SHA256 signed cookies | Expo SecureStore encrypted | ✅ JUSTIFIED | — |
| **Biometric Lock** | N/A | Face ID / fingerprint | ✅ MOBILE-ONLY | — |
| **Session Confirmation** | N/A | Privileged role confirmation | ✅ MOBILE-ONLY | — |
| **Domain Types** | BuildSummary, WorkItemSummary, etc. | AlertItem, ApprovalItem, etc. | ⚠️ DIVERGENT | P0 |
| **Feature Flags** | 7 flags | 4 flags | ✅ CONTEXT-APPROPRIATE | — |
| **Region Support** | 3 regions (ng, za, eu) | No region support | ⚠️ MISSING | P1 |
| **Config Prefix** | NEXT_PUBLIC_BAC_* | EXPO_PUBLIC_BAC_* | ✅ FRAMEWORK-REQUIRED | — |
| **Token Sync** | Automated (sync-design-tokens.sh) | Manual (hardcoded in tamagui.ts) | ❌ DRIFT RISK | P1 |
| **Error Tracking** | Configured, not wired | Configured, not wired | ⚠️ BOTH MISSING | P1 |
| **E2E Testing** | Playwright (3 browsers) | None configured | ⚠️ MOBILE MISSING | P1 |
| **Lockfile in CI** | --no-frozen-lockfile | --no-frozen-lockfile | ⚠️ NON-DETERMINISTIC | P1 |
| **Package Scope** | @bac/* | @bac-mobile/* | ✅ CORRECT | — |

---

## Appendix B — File Inventory Summary

### AI-Frontend-Experience

| Category | Count |
|----------|-------|
| Apps | 3 (software-factory-web, platform-automation-web, docs-portal) |
| Shared packages | 10 (@bac/ui, auth, config, api-clients, design-tokens, observability, testing, eslint-config, tsconfig, + root) |
| UI components | 29+ |
| Domain routes | 32 (software-factory) + 14 (platform) + 10 (docs) |
| API routes | 8 (auth, proxy, health, graphql) |
| CI workflows | 3 (pr, push, release) + dependabot |
| Documentation files | 6 |
| Test configurations | 2 (vitest + playwright) |
| Sync scripts | 3 (tokens, proto, openapi) |

### AI-Companion-Mobile

| Category | Count |
|----------|-------|
| Apps | 1 (operator-mobile) |
| Shared packages | 5 (@bac-mobile/ui-mobile, auth-mobile, api-mobile-clients, config, testing) |
| UI components | 11 |
| Screens | 52 (3 auth + 5 tabs + 44 deep stacks) |
| CI workflows | 2 (ci, preview-build) + dependabot |
| Documentation files | 5 |
| Test configurations | 1 (jest + jest-expo) |
| Sync scripts | 0 |

---

*This review was conducted against the repository state as of 2026-03-23. All findings are based on direct source code analysis. No backend integration testing was performed as backends are not yet available for these frontends.*
