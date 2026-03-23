# BAC Platform — Master Architecture & Orchestration Package

**Version:** 2.0.0-FINAL
**Date:** 2026-03-23
**Author:** Chief Architecture Strategist, StratoGroup
**Status:** AUTHORITATIVE — Codex Implementation Baseline / Antigravity Verification Baseline
**Classification:** Production Architecture — Not Brainstorming

---

## 1. Executive Architecture Summary

The BAC platform is a 6-repository ecosystem organized into 3 strategic layers — Design, Backend/Control, and Experience — that delivers an AI-first software factory and platform automation control plane from design concept through production deployment. Each repository is independently deployable, independently testable, and owns a distinct bounded context. Cross-repo integration is achieved exclusively through versioned contract artifacts, generated clients, validated design tokens, and CI-enforced compatibility matrices.

**Ecosystem Numbers:**

| Metric | Value |
|--------|-------|
| Repositories | 6 |
| Strategic layers | 3 |
| Backend languages | Go |
| Experience languages | TypeScript |
| Design languages | TypeScript + Python + Markdown |
| Web applications | 3 (Software Factory, Platform Automation, Docs Portal) |
| Mobile application | 1 (Operator Companion) |
| Shared web packages | 11 (@bac/*) |
| Shared mobile packages | 7 (@bac-mobile/*) |
| Proto service definitions | 13 |
| OpenAPI endpoints | 30+ |
| GitHub Actions workflows | 19 across experience repos |
| CI quality gates | 10 per PR |
| Maestro E2E flows | 12 |
| Playwright E2E specs | 9 |
| Design token themes | 4 (enterprise/consumer × dark/light) |
| i18n locales | 3 (en, fr, pt) |

**Authoritative Decisions:**

| Decision | Choice |
|----------|--------|
| Repo topology | 6 independent repos, 3 layers |
| Backend | Go, hexagonal architecture, Connect-ES + OpenAPI 3.1 |
| Web | Next.js 15, App Router, React 19, pnpm + Turborepo |
| Mobile | React Native + Expo 52, Expo Router v4, Tamagui |
| Design pipeline | Stitch (explore) → Figma (converge) → Experience (consume) |
| Auth | Authentik OIDC + SpiceDB authorization |
| State | TanStack Query (server) + Zustand (client) |
| Observability | OpenTelemetry + Sentry + VictoriaStack |
| Tokens | Zod-validated JSON → CSS variables (web) / Tamagui themes (mobile) |
| Messaging | NATS JetStream (regional) + Redpanda (inter-regional) |
| Data | Hasura + PostgreSQL |
| Search | Meilisearch (product) + Qdrant (semantic) |

---

## 2. 3-Layer Ecosystem Model

### Layer Definitions

**DESIGN LAYER** — Produces visual direction and production-intent design artifacts.

| Repo | Purpose |
|------|---------|
| Design-Factory_Stitch | High-velocity, divergent exploration. Generates many design directions from product briefs. Outputs concept inventories, screen maps, and handoff packs. Never produces production-intent specs. |
| Design-Factory_Figma | Measured, convergent refinement. Takes Stitch explorations and produces Zod-validated design tokens, route maps, component specs, state maps, and handoff exports. This is the canonical source of design truth for engineering. |

**BACKEND / CONTROL LAYER** — Owns business logic, data, and API contracts.

| Repo | Purpose |
|------|---------|
| AI-Software-Factory | AI-first software generation: PRD intake → architecture review → code generation → build/deploy → compliance → quality gates → audit. Publishes OpenAPI 3.1 + Protobuf/Connect-ES contracts. |
| AI-Platform-Automation | Platform control plane: tenancy, workspace provisioning, Kratix promises, Fleet GitOps rollout, observability, policy/security, incident management, quotas. Publishes OpenAPI 3.1 + Protobuf contracts. |

**EXPERIENCE LAYER** — Consumes contracts and design artifacts. Renders UI.

| Repo | Purpose |
|------|---------|
| AI-Frontend-Experience | Unified web experience: 3 Next.js apps (Software Factory, Platform Automation, Docs Portal), 11 shared packages, generated API clients, design token consumption. |
| AI-Companion-Mobile | Mobile companion: 1 Expo app, 7 shared packages, operational quick-actions (alerts, approvals, incidents, monitoring). |

### Why This Layering Is Strategically Correct

1. **Separation of velocity.** Design iterates fastest (hourly). Experience iterates frequently (daily). Backend iterates carefully (weekly). Different cadences require different repos.
2. **Separation of skill.** Designers work in Stitch/Figma. Frontend engineers work in TypeScript/React. Backend engineers work in Go. No team needs another team's toolchain.
3. **Separation of blast radius.** A broken design exploration affects nothing. A broken UI affects users. A broken backend affects the platform. Isolation prevents cascade.
4. **Separation of deployment.** Design publishes artifacts. Web deploys containers. Mobile deploys to app stores. Backend deploys to Kubernetes. Each has its own pipeline.

### How Layers Interact Without Collapsing Boundaries

```
DESIGN LAYER ──(publishes artifacts)──> EXPERIENCE LAYER ──(HTTP/gRPC at runtime)──> BACKEND LAYER
     │                                        ▲                                           │
     │                                        │                                           │
     └── concept inventories ─────────────────┘                                           │
                                              └── OpenAPI + Proto contracts ──────────────┘
```

**Rule: Layers communicate through versioned, schema-validated artifacts. Never through shared source code, shared databases, or shared runtimes.**

---

## 3. Role and Ownership of Each Repo

### 3.1 AI-Software-Factory

| Attribute | Value |
|-----------|-------|
| **Owner** | Software Engineering Team |
| **Language** | Go |
| **Location** | `AI-Software-Factory/neuroforge-sdx/` |
| **Domains** | PRD intake, architecture review, code generation, build/deploy, compliance, quality gates, agent orchestration, audit |
| **API surface** | OpenAPI 3.1 (REST) + 13 Protobuf services via Connect-ES |
| **Proto services** | gateway, build, workitem, compliance, agent, artifact, audit, deploy, events, llm, quality, tenant, common |
| **Publishes** | `software-factory-openapi`, `software-factory-proto`, `software-factory-connect-typescript` |
| **Consumers** | AI-Frontend-Experience, AI-Companion-Mobile |
| **Does NOT own** | Frontend UI, mobile screens, design tokens, design specifications |

### 3.2 AI-Platform-Automation

| Attribute | Value |
|-----------|-------|
| **Owner** | Platform Engineering Team |
| **Language** | Go + Declarative IaC (Helm, Kustomize, Terraform, Crossplane, Kratix, KubeVela) |
| **Location** | `AI Platform Automation/` |
| **Domains** | Tenancy, workspace provisioning, promises, GitOps rollout, observability, policy/security, incident management, quotas |
| **API surface** | OpenAPI 3.1 (REST) + Protobuf (control plane RPC) + Hasura GraphQL |
| **Publishes** | `platform-automation-openapi`, `platform-automation-proto` |
| **Consumers** | AI-Frontend-Experience, AI-Companion-Mobile |
| **Does NOT own** | Frontend UI, mobile screens, design tokens, design specifications |

### 3.3 Design-Factory_Stitch

| Attribute | Value |
|-----------|-------|
| **Owner** | Design Team (Exploration) |
| **Language** | Markdown, Python (tooling), prompt templates |
| **Location** | `Design Factory_Stitch/` |
| **Outputs** | Concept inventories, screen maps, design briefs, handoff packs |
| **Governance** | 15 governance documents, 27 templates, 4 playbooks |
| **Publishes** | `stitch-concept-inventory`, `stitch-screen-maps`, `stitch-exploratory-prompts` |
| **Consumer** | Design-Factory_Figma (primary), Experience repos (screen maps only) |
| **Does NOT produce** | Production-intent designs, tokens, component specs, or any artifact consumed directly by engineering for implementation |

### 3.4 Design-Factory_Figma

| Attribute | Value |
|-----------|-------|
| **Owner** | Design Team (Production) / Design Engineering |
| **Language** | TypeScript (Fastify + Temporal workflows), Figma API |
| **Location** | `Design-Factory_Figma/` |
| **Packages** | contracts, prompts, templates, utils |
| **Outputs** | Zod-validated design tokens, route maps, component specs, state maps, handoff exports |
| **Publishes** | `figma-design-tokens`, `figma-web-route-map`, `figma-mobile-route-map`, `figma-component-specs-web`, `figma-component-specs-mobile`, `figma-state-maps` |
| **Consumers** | AI-Frontend-Experience, AI-Companion-Mobile |
| **Does NOT own** | Backend APIs, exploratory concepts, runtime services consumed by end users |

### 3.5 AI-Frontend-Experience

| Attribute | Value |
|-----------|-------|
| **Owner** | Frontend Engineering Team |
| **Language** | TypeScript |
| **Location** | `AI-Frontend-Experience/` |
| **Framework** | Next.js 15 (App Router, RSC, standalone output) |
| **Apps** | software-factory-web (:3000), platform-automation-web (:3001), docs-portal (:3002) |
| **Packages** | 11: ui, design-tokens, api-clients, auth, config, observability, domain-contracts, i18n, testing, eslint-config, tsconfig |
| **Workflows** | 13: pr, push, release, preview, docker, a11y, bundle-analysis, integration, sbom, lighthouse, e2e, security, load-test |
| **Consumes** | OpenAPI, Proto/Connect-ES, design tokens, route maps, component specs, state maps |
| **Does NOT own** | Backend APIs, design specifications, mobile screens |

### 3.6 AI-Companion-Mobile

| Attribute | Value |
|-----------|-------|
| **Owner** | Mobile Engineering Team |
| **Language** | TypeScript |
| **Location** | `AI-Companion-Mobile/` |
| **Framework** | React Native + Expo 52, Expo Router v4 |
| **Apps** | operator-mobile (single app, multi-product) |
| **Packages** | 7: ui-mobile, api-mobile-clients, auth-mobile, config, observability, i18n-mobile, testing |
| **Workflows** | 6: ci, integration, preview-build, e2e, sbom, security |
| **Consumes** | OpenAPI, design tokens, route maps, component specs |
| **Does NOT own** | Backend APIs, design specifications, web applications |

---

## 4. Why These Repo Boundaries Are Correct

### 4.1 Why Frontend/Mobile Must Not Merge Into Backend Repos

| Factor | Backend | Experience |
|--------|---------|-----------|
| Language | Go | TypeScript |
| Build system | Makefile + Go modules | pnpm + Turborepo |
| Deployment | Helm → Kubernetes | Docker/CDN (web), EAS (mobile) |
| Release cadence | Weekly (stability-driven) | Daily (feature-driven) |
| Team skills | Go, Kubernetes, gRPC | React, TypeScript, CSS |
| Blast radius | Platform-wide | User-facing only |

Merging would create a polyglot monolith with conflicting build systems, release cadences, and team ownership.

### 4.2 Why Stitch and Figma Must Remain Separate

| Factor | Stitch | Figma |
|--------|--------|-------|
| Purpose | Divergent exploration | Convergent refinement |
| Fidelity | Low-fi concepts | Production-intent specs |
| Velocity | Many directions, fast | One direction, measured |
| Output lifecycle | Disposable explorations | Versioned contract artifacts |
| Audience | Product/design stakeholders | Engineering consumers |
| Tooling | Prompt-driven, markdown | Figma API, Temporal workflows |

Merging would conflate exploratory outputs (which should be disposable) with production contracts (which must be versioned and validated).

### 4.3 Why Web and Mobile Must Be Separate Repos

| Factor | Web | Mobile |
|--------|-----|--------|
| Runtime | Node.js (Next.js standalone) | React Native (Hermes/JSC) |
| Build | Dockerfile → container image | EAS Build → native binary |
| UI framework | Tailwind + custom components | Tamagui + native components |
| Testing | Vitest + Playwright | Jest + Maestro |
| Deployment | Kubernetes → CDN | App Store + Google Play |
| Package namespace | @bac/* | @bac-mobile/* |

Merging would create build-system collisions with no shared runtime benefit.

### 4.4 Why Not One Monorepo

Six repos with 3 strategic layers gives: independent CI pipelines, independent release cadences, independent team ownership, independent security boundaries, and independent scaling. A single monorepo would require every team to understand every toolchain, every CI run to build everything, and every release to coordinate everything. The contract-based integration model achieves coherence without coupling.

---

## 5. Cross-Repo Contract Ownership Model

### 5.1 Contract Artifact Ownership Matrix

| Artifact | Format | Producing Repo | Versioning | Consumers |
|----------|--------|---------------|-----------|-----------|
| `software-factory-openapi` | OpenAPI 3.1 YAML/JSON | AI-Software-Factory | GitHub Release tag | Frontend, Mobile |
| `software-factory-proto` | Protobuf (buf-managed) | AI-Software-Factory | GitHub Release tag | Frontend |
| `software-factory-connect-typescript` | Connect-ES TypeScript | AI-Software-Factory | GitHub Release tag | Frontend |
| `platform-automation-openapi` | OpenAPI 3.1 YAML/JSON | AI-Platform-Automation | GitHub Release tag | Frontend, Mobile |
| `platform-automation-proto` | Protobuf | AI-Platform-Automation | GitHub Release tag | Frontend |
| `figma-design-tokens` | Zod-validated JSON | Design-Factory_Figma | GitHub Release tag | Frontend, Mobile |
| `figma-web-route-map` | JSON manifest | Design-Factory_Figma | GitHub Release tag | Frontend |
| `figma-mobile-route-map` | JSON manifest | Design-Factory_Figma | GitHub Release tag | Mobile |
| `figma-component-specs-web` | JSON specs | Design-Factory_Figma | GitHub Release tag | Frontend |
| `figma-component-specs-mobile` | JSON specs | Design-Factory_Figma | GitHub Release tag | Mobile |
| `figma-state-maps` | JSON specs | Design-Factory_Figma | GitHub Release tag | Frontend, Mobile |
| `stitch-concept-inventory` | Markdown + JSON | Design-Factory_Stitch | GitHub Release tag | Figma |
| `stitch-screen-maps` | JSON | Design-Factory_Stitch | GitHub Release tag | Figma, Frontend |
| `stitch-exploratory-prompts` | JSON | Design-Factory_Stitch | GitHub Release tag | Figma |

### 5.2 Contract Rules (Enforceable)

1. **Producers own schemas.** A consumer never modifies an upstream contract artifact.
2. **Breaking changes require semver major bumps.** Consumers pin to `^major.minor` ranges.
3. **Contract validation runs in every consumer PR CI.** The `integration.yml` workflow validates against pinned upstream versions.
4. **Drift detection is automated.** `validate-contract-drift.mjs` compares local generated code to upstream specs.
5. **Compatibility manifests are machine-readable.** `compatibility/manifest.json` in every consumer repo.

### 5.3 Compatibility Manifest Schema

Each consumer repo maintains `compatibility/manifest.json`:

```json
{
  "schemaVersion": "1.0.0",
  "repo": "<consumer-repo-name>",
  "repoVersion": "<consumer-version>",
  "compatibleUpstreams": [
    {
      "repo": "<producer-repo>",
      "artifactId": "<artifact-name>",
      "supportedRange": "^1.0.0"
    }
  ],
  "validatedAt": "<ISO-8601>"
}
```

---

## 6. Integration Flows Between All 6 Repos

### 6.1 Design Flow

```
Product Brief ──> Stitch (explore many directions)
                     │
                     ▼ handoff pack (concept inventory + screen maps)
                  Figma (converge to one direction)
                     │
                     ├── design tokens (JSON) ──> Frontend + Mobile
                     ├── route maps (JSON) ──> Frontend + Mobile
                     ├── component specs (JSON) ──> Frontend + Mobile
                     └── state maps (JSON) ──> Frontend + Mobile
```

### 6.2 Contract Flow

```
Software Factory ──(tag release)──> contracts/software-factory-*/v1.x
Platform Automation ──(tag release)──> contracts/platform-automation-*/v1.x
         │                                          │
         ▼ (sync-upstreams.mjs)                     ▼
    Frontend: contracts/upstreams/              Mobile: contracts/upstreams/
         │                                          │
         ▼ (generate-client-bindings.mjs)           ▼
    packages/api-clients/src/generated/     packages/api-mobile-clients/src/generated/
```

### 6.3 Generated Client Flow

```
OpenAPI JSON spec ──> generate-client-bindings.mjs ──> TypeScript client class
                                                          │
                                                    Constructor: { baseUrl, getToken }
                                                    Methods: typed per endpoint
                                                    Uses: http.ts transport (web) / fetch (mobile)
```

### 6.4 Release Flow

```
Phase 1 (parallel): Backend + Design repos tag releases, publish contract artifacts
Phase 2 (sequential): Experience repos sync contracts, regenerate clients, validate, release
```

### 6.5 Local Development Flow

```
Developer clones experience repo ──> pnpm install ──> pnpm dev
  │
  ├── Mock mode ON (default): all APIs return mock data, no backend needed
  ├── Contract sync: pnpm contracts:generate (pulls from GitHub Releases)
  └── Cross-repo: set API base URL to local backend instance
```

### 6.6 Verification Flow

```
PR opened ──> CI runs:
  1. lint + typecheck + test + build (quality gate)
  2. contracts:validate (contract drift check)
  3. design:validate (token drift check)
  4. bundle-analysis (size budget check)
  5. a11y audit (accessibility check)
  6. security audit (dependency scan)
```

---

## 7. API Contract Model

### 7.1 Ownership

| API Surface | Owner | Location |
|-------------|-------|----------|
| SDX REST API | AI-Software-Factory | `api/openapi/openapi.yaml` |
| SDX gRPC/Connect-ES | AI-Software-Factory | `api/proto/sdx/v1/*.proto` |
| Platform REST API | AI-Platform-Automation | `api/openapi/platform-automation-v1.openapi.yaml` |
| Platform gRPC | AI-Platform-Automation | `api/proto/platform/v1/control_plane.proto` |
| Platform GraphQL | AI-Platform-Automation (via Hasura) | Hasura metadata |

### 7.2 Versioning

- URL path prefix: `/v1/`, `/v2/`
- Semver on release tags: `contracts/<artifact>/v<major>.<minor>.<patch>`
- Breaking changes: major bump, cannot auto-update in consumers
- Additive changes: minor bump, auto-update via `integration.yml`
- Fixes: patch bump, auto-update via `integration.yml`

### 7.3 Client Generation

**Web:** `scripts/integration/generate-client-bindings.mjs` parses OpenAPI JSON, generates `SoftwareFactoryApiClient` (19 methods) and `PlatformAutomationApiClient` (8 methods) as TypeScript classes using string templates. No external codegen library. Uses `http.ts` transport.

**Mobile:** Same script pattern generates `SoftwareFactoryMobileClient` (19 methods) and `PlatformAutomationMobileClient` (8 methods) using React Native's built-in `fetch()`.

### 7.4 Drift Detection

`validate-contract-drift.mjs` runs in CI on every PR:
1. Re-runs `generate-client-bindings.mjs`
2. Diffs generated output against committed files
3. Fails PR if any difference detected
4. Developer must run `pnpm contracts:generate` and commit

---

## 8. Design Handoff Model

### 8.1 Stitch Exploratory Flow

1. Product brief arrives at `intake/`
2. Design DNA written (`DESIGN.md`)
3. Stitch prompts generate concept inventory
4. Screen maps define navigation structure
5. Handoff pack assembled (concept inventory + screen maps + design notes)
6. Release tagged: `handoff/stitch-*/v<semver>`

### 8.2 Figma Convergence Flow

1. Stitch handoff pack imported into `prompts/`
2. Temporal workflows refine concepts into production components
3. Design tokens extracted and Zod-validated via `packages/contracts/`
4. Route maps and component specs published to `handoff/`
5. Release tagged: `handoff/figma-*/v<semver>`

### 8.3 Artifact Ownership

| Artifact | Owner | Validates Against |
|----------|-------|-------------------|
| Design tokens (JSON) | Design-Factory_Figma | Zod schema in `packages/contracts/src/schemas/tokens.ts` |
| Web route map | Design-Factory_Figma | App Router routes in `AI-Frontend-Experience/apps/*/app/` |
| Mobile route map | Design-Factory_Figma | Expo Router routes in `AI-Companion-Mobile/apps/operator-mobile/app/` |
| Component specs (web) | Design-Factory_Figma | `@bac/ui` components in `AI-Frontend-Experience/packages/ui/` |
| Component specs (mobile) | Design-Factory_Figma | `@bac-mobile/ui-mobile` components in `AI-Companion-Mobile/packages/ui-mobile/` |
| State maps | Design-Factory_Figma | Hook/state implementations in experience repos |

### 8.4 Token Transformation

| Target | Transform | Output |
|--------|-----------|--------|
| Web CSS | `tokenSetToCssVariables()` | CSS custom properties |
| Web Tailwind | `tokenSetToTailwindTheme()` | Tailwind `extend` config |
| Mobile Tamagui | `createThemeFromTokens()` | 4 Tamagui theme objects |

### 8.5 Design-to-Code Traceability

```
Stitch concept → Figma component spec → @bac/ui component → App route page → Design tokens → Figma handoff
```

Every UI surface traces back to a design artifact. `validate-design-drift.mjs` enforces this in CI.

---

## 9. Generated Client Model

### 9.1 Web Client Generation

| Source | Tool | Output | Location |
|--------|------|--------|----------|
| SDX OpenAPI | `generate-client-bindings.mjs` | `SoftwareFactoryApiClient` class (19 methods, 15+ types) | `packages/api-clients/src/generated/software-factory-client.ts` |
| Platform OpenAPI | `generate-client-bindings.mjs` | `PlatformAutomationApiClient` class (8 methods, 15+ types) | `packages/api-clients/src/generated/platform-automation-client.ts` |
| SDX Protobuf | `buf generate` + `protoc-gen-connect-es` | 11 Connect-ES service stubs | `packages/api-clients/src/generated/sdx/v1/*_connect.ts` |
| Endpoint registry | `generate-client-bindings.mjs` | Contract registry + factory | `packages/api-clients/src/generated/contract-registry.ts` |

### 9.2 Mobile Client Generation

| Source | Tool | Output | Location |
|--------|------|--------|----------|
| SDX OpenAPI | `generate-client-bindings.mjs` | `SoftwareFactoryMobileClient` class (19 methods) | `packages/api-mobile-clients/src/generated/software-factory-client.ts` |
| Platform OpenAPI | `generate-client-bindings.mjs` | `PlatformAutomationMobileClient` class (8 methods) | `packages/api-mobile-clients/src/generated/platform-client.ts` |

### 9.3 Mock-to-Live Switch

Both repos use the `mockApi` feature flag:
- `mockApi=true` (default in development): query hooks return mock data
- `mockApi=false` (staging/production): query hooks call generated typed clients

### 9.4 Regeneration Workflow

```bash
pnpm contracts:generate    # Sync upstream specs + regenerate clients
pnpm contracts:validate    # Verify no drift between generated and committed
```

---

## 10. CI/CD and Release Model

### 10.1 Per-Repo CI

| Repo | Trigger | Gates |
|------|---------|-------|
| AI-Frontend-Experience | PR to main | lint → typecheck → test → build → bundle-analysis → a11y → contract-validate → design-validate |
| AI-Companion-Mobile | PR to main | lint → typecheck → test → build → contract-validate → design-validate |
| AI-Software-Factory | PR to main | go vet → go test → go build → openapi-drift |
| AI-Platform-Automation | PR to main | go vet → go test → conformance |
| Design-Factory_Figma | PR to main | vitest → typecheck → contract-schema-validate |
| Design-Factory_Stitch | PR to main | markdown-lint → checklist-validate |

### 10.2 Cross-Repo Compatibility

`integration.yml` in each experience repo:
1. Syncs upstream contracts from GitHub Releases
2. Regenerates client bindings
3. Validates no contract drift
4. Validates design token drift
5. Runs full quality gate
6. Publishes compatibility report

### 10.3 Release Tagging

| Repo | Tag Pattern | Artifacts Published |
|------|------------|-------------------|
| AI-Software-Factory | `v<semver>` | OpenAPI spec, Proto package, Connect-ES types, Docker image |
| AI-Platform-Automation | `v<semver>` | OpenAPI spec, Proto package, Docker image |
| Design-Factory_Figma | `v<semver>` | Design tokens, route maps, component specs, state maps |
| Design-Factory_Stitch | `v<semver>` | Concept inventories, screen maps, exploratory prompts |
| AI-Frontend-Experience | `v<semver>` | Docker images (3 apps), SBOM |
| AI-Companion-Mobile | `v<semver>` | EAS Build (iOS + Android), SBOM |

### 10.4 Release Sequence

Backend/Design repos release first (Phase 1, parallel) → Experience repos sync, validate, release second (Phase 2, sequential). Web and mobile release independently of each other.

---

## 11. Compatibility Matrix Model

### 11.1 Representation

Each experience repo maintains `compatibility/manifest.json` declaring supported upstream version ranges. CI validates these ranges on every PR.

### 11.2 Breakage Detection

1. **Minor/patch upstream release**: `integration.yml` auto-creates PR with updated contract
2. **Major upstream release**: `integration.yml` creates GitHub Issue (not PR), requires manual migration
3. **Design token change**: `validate-design-drift.mjs` fails if token schema breaks
4. **Route map change**: Coverage check verifies ≥95% of design routes have app routes

### 11.3 Release Coordination

No cross-repo release lock required. Each repo releases independently. Compatibility is validated post-release via consumer CI. If a consumer CI fails after upstream release, the consumer team decides whether to upgrade or pin to the previous version.

---

## 12. Local Development and Integration Model

### 12.1 Developer Workflow

```bash
# Clone one repo, install, develop
git clone <repo> && cd <repo> && pnpm install && pnpm dev

# All APIs mock by default — no backend needed
# To sync contracts from latest upstream releases:
pnpm contracts:generate

# To develop against local backend:
NEXT_PUBLIC_BAC_API_URL=http://localhost:8080 pnpm dev       # web
EXPO_PUBLIC_BAC_API_BASE_URL=http://localhost:8080 pnpm dev  # mobile
```

### 12.2 Mock/Stub Strategy

- **Web**: `@bac/api-clients/src/mock/data.ts` provides mock datasets. `mockApi` feature flag switches behavior.
- **Mobile**: `@bac-mobile/api-mobile-clients/src/mock.ts` provides role-aware mock datasets.
- **Auth**: Mock login button on login page creates local session without Authentik.
- **Design tokens**: Committed token JSON files in `packages/design-tokens/src/tokens/` and `packages/ui-mobile/src/tokens/`.

### 12.3 Prerequisites

| Tool | Version | Required By |
|------|---------|-------------|
| Node.js | ≥ 20.10.0 | All experience repos |
| pnpm | 9.15.9 | All experience repos |
| Go | ≥ 1.22 | Backend repos (optional for frontend devs) |
| Docker | ≥ 24 | Container builds |
| Expo CLI | ≥ 52 | Mobile development |

---

## 13. Deployment Model

### 13.1 Independent Deployability

Each repo deploys independently. No cross-repo deployment lock.

### 13.2 Backend Deployment

| Repo | Packaging | Orchestration | Strategy |
|------|-----------|--------------|----------|
| AI-Software-Factory | Helm chart + Docker | Fleet + KubeVela | Canary (10% → 50% → 100%) |
| AI-Platform-Automation | Helm + Kustomize + Terraform | Fleet + Crossplane + Kratix | Blue-green per region |

### 13.3 Web Deployment

| Environment | Trigger | Infrastructure |
|------------|---------|---------------|
| Preview | PR created | Ephemeral namespace or Vercel preview |
| Staging | Merge to main | Kubernetes (Fleet-managed) |
| Production | Release tag | Kubernetes (Fleet-managed, canary) |

Container: Multi-stage Dockerfile, standalone Next.js, Alpine base, non-root user (UID 1001), `/api/health` endpoint.

### 13.4 Mobile Deployment

| Environment | Distribution | Channel |
|------------|-------------|---------|
| Development | Expo Go / Dev Client | development |
| Preview | TestFlight / Firebase | preview |
| Staging | TestFlight / Firebase | staging |
| Production | App Store + Google Play | production |

OTA updates via EAS Update for JavaScript-only changes. Full native build for SDK upgrades.

### 13.5 Design Deployment

Design repos do not deploy runtime services. They publish versioned artifacts via GitHub Releases.

---

## 14. Governance Model

### 14.1 Ownership

| Repository | Owning Team | Deployment Authority |
|-----------|------------|---------------------|
| AI-Software-Factory | Software Engineering | SDX Tech Lead + Architecture |
| AI-Platform-Automation | Platform Engineering | Platform Tech Lead + Architecture |
| Design-Factory_Stitch | Design (Exploration) | Design Director |
| Design-Factory_Figma | Design (Production) | Design Engineering Lead + Architecture |
| AI-Frontend-Experience | Frontend Engineering | Frontend Tech Lead |
| AI-Companion-Mobile | Mobile Engineering | Mobile Tech Lead |

### 14.2 Change Control

| Change Type | Required Reviewers | Approvals |
|------------|-------------------|-----------|
| App-only change | App team | 1 |
| Shared package change | Package owner + consumer team | 2 |
| Contract artifact update | Architecture + affected consumers | 2 |
| Auth/security change | Security lead | 2 |
| Design token change | Design engineering + architecture | 2 |
| Breaking change (major) | Architecture + all affected teams | 3 |

### 14.3 ADR Expectations

Every architectural decision that affects cross-repo integration, contract schemas, deployment topology, or technology selection MUST be recorded as an ADR in the relevant repo's `docs/adr/` directory.

### 14.4 Quality Gates

| Gate | When | Fails PR If |
|------|------|-------------|
| Lint | Every PR | Any lint error |
| Type check | Every PR | Any type error |
| Unit tests | Every PR | Any test failure |
| Contract validation | Every PR | Generated code differs from committed |
| Design validation | Every PR | Token schema validation fails |
| Bundle analysis | Every PR (web) | Budget exceeded (main chunk > 250KB gzipped) |
| Accessibility | Every PR (web) | WCAG 2.1 AA violation |
| Security scan | Every PR | Critical/high CVE |

---

## 15. Required Baseline Artifacts

These files MUST exist before Codex implementation or Antigravity verification begins. They prevent reinterpretation of the ecosystem.

### 15.1 ECOSYSTEM_REPO_CATALOG.md

**Location:** Repository root of each repo + `/Users/AbiolaOgunsakin1/Workflows/`

**Contents:** The exact 6 repo descriptions as stated in the operator note. This file is the single source of truth for what each repo does and does not do.

```markdown
# BAC Ecosystem — Repository Catalog

| # | Repository | Description |
|---|-----------|-------------|
| 1 | AI-Software-Factory | AI-first software generation system for turning PRDs into production-ready services, APIs, tests, docs, and Swagger/OpenAPI compliance workflows. |
| 2 | AI-Platform-Automation | BAC platform automation control plane for tenancy, workspace provisioning, promises, GitOps rollout, observability, policy, and governed infrastructure automation. |
| 3 | Design-Factory_Stitch | Prompt-driven UI concept generation system for producing broad, high-velocity enterprise design directions and multi-screen UX explorations in Stitch. |
| 4 | Design-Factory_Figma | Interactive design convergence system for refining Stitch concepts into production-intent Figma/Figma Make design systems, flows, components, and handoff-ready UI architecture. |
| 5 | AI-Frontend-Experience | Unified web frontend experience layer for AI Software Factory and AI Platform Automation, including shared UI, design tokens, docs portal, and Swagger/API explorer. |
| 6 | AI-Companion-Mobile | Mobile companion app for alerts, approvals, incidents, monitoring, and quick actions across AI Software Factory and AI Platform Automation. |
```

### 15.2 ECOSYSTEM_LAYER_MODEL.md

The 3-layer strategic model with layer definitions, interaction rules, and invariant constraints.

### 15.3 ECOSYSTEM_FOLDER_TREE.md

The exact approved folder tree as provided in this document.

### 15.4 CONTRACT_OWNERSHIP.md

The contract artifact ownership matrix from Section 5.

### 15.5 COMPATIBILITY_MATRIX.md

The compatibility manifest schema and validation rules from Section 11.

### 15.6 CROSS_REPO_RELEASE_FLOW.md

The release sequence and coordination rules from Section 10.4.

### 15.7 LOCAL_INTEGRATION_GUIDE.md

The local development workflow from Section 12.

**Status:** All 7 baseline artifacts already exist in both experience repos' `docs/` directories. The central `ECOSYSTEM_REPO_CATALOG.md` must be created at `/Users/AbiolaOgunsakin1/Workflows/`.

---

## 16. ADR List

### ADR-001: 3-Layer Ecosystem Model
**Decision:** Organize 6 repos into Design, Backend/Control, and Experience layers with one-directional artifact flow.
**Rationale:** Separates velocity, skill, blast radius, and deployment topology.

### ADR-002: Independent Repository Boundaries
**Decision:** Maintain 6 separate repos instead of a monorepo.
**Rationale:** Independent CI, independent release cadence, independent team ownership, independent scaling.

### ADR-003: Contract-Based Cross-Repo Integration
**Decision:** Repos integrate through versioned contract artifacts (OpenAPI, Proto, design tokens), not shared source code.
**Rationale:** Preserves independent deployability while enabling typed integration.

### ADR-004: Design Handoff Ownership — Figma as Canonical Source
**Decision:** Design-Factory_Figma owns all production-intent design artifacts. Stitch is exploratory only.
**Rationale:** Separates disposable explorations from versioned engineering contracts.

### ADR-005: Generated Client Ownership — Consumer Repos Generate
**Decision:** Consumer repos (Frontend, Mobile) run codegen scripts against synced upstream specs. Producers do not generate consumer-side code.
**Rationale:** Consumers control their own dependency resolution, type mapping, and build integration.

### ADR-006: Swagger/OpenAPI Compliance as First-Class
**Decision:** AI-Software-Factory publishes OpenAPI 3.1 specs alongside Proto definitions. API explorer routes exist in the web frontend.
**Rationale:** OpenAPI is the universal API documentation format. Swagger UI provides interactive testing.

### ADR-007: Compatibility Matrix Model
**Decision:** Each consumer repo maintains `compatibility/manifest.json` declaring supported upstream version ranges.
**Rationale:** Machine-readable compatibility enables automated CI validation and breakage detection.

### ADR-008: CI/CD with Quality Gates
**Decision:** Every PR runs lint → typecheck → test → build → contract-validate → design-validate.
**Rationale:** Catches integration drift at PR time, not post-merge.

### ADR-009: Independent Deployability
**Decision:** Each repo deploys independently. No cross-repo deployment lock.
**Rationale:** Teams can ship without waiting for other teams. Compatibility is validated post-release.

### ADR-010: Frontend/Mobile Separation
**Decision:** Web (Next.js) and mobile (Expo) live in separate repos with separate package namespaces.
**Rationale:** Different runtimes, build systems, testing tools, deployment targets. No shared runtime benefit.

### ADR-011: Stitch vs Figma Boundary
**Decision:** Stitch explores, Figma converges. The handoff pack is the interface.
**Rationale:** Exploration requires freedom from versioning constraints. Production design requires versioning.

### ADR-012: Release Governance — Sequential Phases
**Decision:** Backend/Design release first, then Experience repos sync and release.
**Rationale:** Producers must publish contracts before consumers can validate against them.

### ADR-013: Local Integration via Mock-First
**Decision:** Experience repos default to mock mode. No backend required for local development.
**Rationale:** Frontend/mobile developers should not need Go toolchains or Kubernetes clusters.

### ADR-014: Extensibility for Future Repos
**Decision:** New products add apps to experience monorepos and new upstream entries to `contracts/upstreams/`. No structural changes required.
**Rationale:** The monorepo + contract model scales to N products without repo proliferation.

### ADR-015: Verification Model — CI + Antigravity
**Decision:** CI validates contracts and compatibility automatically. Antigravity performs manual architectural compliance verification.
**Rationale:** Automated checks catch drift. Human review catches intent violations.

### ADR-016: Authentik OIDC + SpiceDB Authorization
**Decision:** Authentik for identity, SpiceDB for relationship-based access control, unified 9-role taxonomy.
**Rationale:** Dedicated identity provider with fine-grained authorization across all surfaces.

### ADR-017: TanStack Query + Zustand State Model
**Decision:** TanStack Query for server state, Zustand for client state. Consistent across web and mobile.
**Rationale:** Same data-fetching pattern enables shared mental models and offline-first mobile.

---

## 17. Milestone Plan M1–M10

| Milestone | Weeks | Status | Key Deliverables |
|-----------|-------|--------|-----------------|
| M1: Foundation | 1-2 | ✅ Complete | Repo init, monorepo scaffold, base TypeScript, ESLint, CI |
| M2: Auth + Session | 3-4 | ✅ Complete | OIDC, claims, cookies, guards, biometric, 9-role taxonomy |
| M3: Design System | 5-6 | ✅ Complete | 27 web components, 14 mobile components, 4 themes, Storybook |
| M4: API Clients | 7-8 | ✅ Complete | Connect-ES clients, platform GraphQL, mock data, offline cache |
| M5: Web Routes | 9-10 | ✅ Complete | 50+ web routes across 3 apps, app shells, API explorer |
| M6: Mobile Screens | 11-12 | ✅ Complete | 35+ mobile screens, tab navigation, detail routes |
| M7: Cross-Repo Integration | 13-14 | ✅ Complete | Contract sync, compatibility manifests, drift validation |
| M8: Observability + Config | 15-16 | ✅ Complete | Sentry, OTel, feature flags, multi-region, i18n |
| M9: Production Hardening | 17-18 | ✅ Complete | Dockerfile, EAS, domain contracts, semantic release |
| M10: Release Readiness | 19-20 | ✅ Complete | OpenAPI codegen, Playwright E2E, Maestro E2E, Lighthouse CI, k6 load tests, canary deployment, offline queue, GraphQL subscriptions, push notifications, security audit, SBOM, bundle budgets, staging dry-run, store submission docs |

---

## 18. Handoff Package for Codex

### What Codex Should Implement Next

**Priority 1 — Wire to Production:**
1. Provision real Sentry projects and set DSNs in environment
2. Run `eas init` to create real EAS project ID
3. Replace placeholder app icons with production brand assets
4. Deploy staging environment using `deploy/staging/docker-compose.yml`
5. Run Lighthouse CI against staging and verify budgets pass
6. Run k6 load tests against staging BFF proxies

**Priority 2 — Complete Live API Integration:**
7. Set `NEXT_PUBLIC_BAC_ENABLE_MOCK_API=false` in staging
8. Verify all generated API clients connect to real backend
9. Test WebSocket reconnection with real event streams
10. Test GraphQL subscriptions with real Hasura instance
11. Test push notifications with real FCM/APNs credentials

**Priority 3 — Release Preparation:**
12. Run `pnpm check` in both repos — all gates must pass
13. Run Playwright E2E against staging — all specs must pass
14. Run Maestro E2E against staging build — all flows must pass
15. Run security audit — no critical/high CVEs
16. Create first production release tags for both experience repos

### File Creation Priority

Codex must create `ECOSYSTEM_REPO_CATALOG.md` at `/Users/AbiolaOgunsakin1/Workflows/` before any other work.

---

## 19. Verification Checklist for Antigravity

### Architecture Compliance (Reject if any fail)

| # | Check | Expected |
|---|-------|----------|
| A1 | 6 repositories exist | All 6 present |
| A2 | 3-layer assignment correct | Design(2), Backend(2), Experience(2) |
| A3 | No circular dependencies | Design→Experience←Backend only |
| A4 | Experience repos never import backend source | Contract artifacts only |
| A5 | Backend repos never import frontend source | No TypeScript imports |
| A6 | Design repos produce artifacts only | No deployable containers |
| A7 | Stitch never produces production-intent specs | Exploration only |
| A8 | Package namespaces non-overlapping | @bac/* vs @bac-mobile/* |
| A9 | Contract ownership unambiguous | One producer per artifact |
| A10 | ECOSYSTEM_REPO_CATALOG.md exists | Central + each repo |

### Contract Compliance (Reject if any fail)

| # | Check | Expected |
|---|-------|----------|
| C1 | OpenAPI specs exist in both backends | YAML + JSON |
| C2 | Proto definitions exist in Software Factory | 13 .proto files |
| C3 | Design tokens exist in Figma | Zod schema validated |
| C4 | Consumer repos have contracts/upstreams/ | Synced copies |
| C5 | compatibility/manifest.json exists | Both experience repos |
| C6 | Generated clients compile | TypeScript passes |
| C7 | Contract drift validation passes | CI green |

### Build Compliance (Reject if any fail)

| # | Check | Expected |
|---|-------|----------|
| B1 | `pnpm install` succeeds (web) | Zero errors |
| B2 | `pnpm install` succeeds (mobile) | Zero errors |
| B3 | `pnpm check` passes (web) | All gates green |
| B4 | `pnpm check` passes (mobile) | All gates green |
| B5 | Docker build succeeds (3 web apps) | Standalone output |
| B6 | All 3 web apps start locally | Ports 3000, 3001, 3002 |
| B7 | Mobile app starts locally | Port 8081 |

### Governance Compliance (Reject if any fail)

| # | Check | Expected |
|---|-------|----------|
| G1 | CODEOWNERS in experience repos | Present |
| G2 | ≥ 15 ADRs documented | Present |
| G3 | Conventional commits enforced | CI validates |
| G4 | CI runs on every PR | All repos |
| G5 | Baseline artifacts exist | All 7 documents |

---

## 20. Final Operating Note

### Enforceable Operating Rule for the BAC Ecosystem

Before any agent (Codex, Antigravity, Claude, or any future automation tool) performs work on this ecosystem, it MUST first read and internalize these 3 baseline artifacts:

1. **ECOSYSTEM_REPO_CATALOG.md** — The exact description and boundary of each repo
2. **ECOSYSTEM_FOLDER_TREE.md** — The exact folder structure baseline
3. **ECOSYSTEM_LAYER_MODEL.md** — The 3-layer strategic model

These artifacts are immutable during a work session. No agent may:
- Reinterpret a repo's purpose beyond its catalog description
- Create files outside the approved folder tree without explicit approval
- Collapse layer boundaries (e.g., importing backend code into frontend)
- Modify contract ownership (e.g., having a consumer produce contracts)
- Merge repos, flatten layers, or reorganize the ecosystem topology

**Violation of these rules invalidates the work product.** Antigravity must reject any implementation that violates these baseline artifacts.

This operating rule exists because:
- Codex does not remember cross-session context
- Antigravity does not infer intent from partial implementations
- Both tools operate best when given explicit, unambiguous baselines

The 3 baseline artifacts are the cheapest possible insurance against ecosystem drift.

---

*End of Master Architecture & Orchestration Package*
*Version 2.0.0-FINAL — 2026-03-23*
*StratoGroup — BAC Platform Architecture*
