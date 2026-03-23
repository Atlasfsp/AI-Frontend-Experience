# BAC Platform — Master Ecosystem Architecture Package

**Version:** 1.0.0
**Date:** 2026-03-23
**Author:** Principal Architect, StratoGroup
**Status:** Authoritative — Production Architecture
**Scope:** 6-repository AI platform ecosystem

---

## Table of Contents

1. [Executive Architecture Summary](#1-executive-architecture-summary)
2. [3-Layer Ecosystem Model](#2-3-layer-ecosystem-model)
3. [Role and Ownership of Each Repo](#3-role-and-ownership-of-each-repo)
4. [Why These Repo Boundaries Are Correct](#4-why-these-repo-boundaries-are-correct)
5. [Cross-Repo Contract Ownership Model](#5-cross-repo-contract-ownership-model)
6. [Integration Flows Between All 6 Repos](#6-integration-flows-between-all-6-repos)
7. [API Contract Model](#7-api-contract-model)
8. [Design Handoff Model](#8-design-handoff-model)
9. [Generated Client Model](#9-generated-client-model)
10. [CI/CD and Release Model](#10-cicd-and-release-model)
11. [Compatibility Matrix Model](#11-compatibility-matrix-model)
12. [Local Development and Integration Model](#12-local-development-and-integration-model)
13. [Deployment Model](#13-deployment-model)
14. [Governance Model](#14-governance-model)
15. [ADR List](#15-adr-list)
16. [Milestone Plan M1–M10](#16-milestone-plan-m1m10)
17. [Handoff Package for Codex](#17-handoff-package-for-codex)
18. [Verification Checklist for Antigravity](#18-verification-checklist-for-antigravity)

---

## 1. Executive Architecture Summary

The BAC platform is a 6-repository ecosystem that delivers an AI-first software factory and platform automation control plane, from design concept through production deployment, surfaced via web and mobile experience layers.

### Architecture Thesis

These 6 repositories form 3 strategic layers — **Design**, **Backend/Control**, and **Experience** — connected by versioned contracts, generated clients, and validated design tokens. Each repo is independently deployable, independently testable, and owns a distinct bounded context. Cross-repo integration is achieved through published artifacts (OpenAPI specs, Protobuf schemas, design tokens, route maps, component specs) consumed via automated sync pipelines and validated by compatibility matrices.

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Repo topology | 6 independent repos, 3 layers | Clear ownership, independent release cadence, team-scale boundaries |
| Backend language | Go | Performance, strong typing, gRPC-native, Kubernetes ecosystem fit |
| Web framework | Next.js 15 + React 19 | App Router, RSC, standalone output, monorepo-friendly |
| Mobile framework | React Native + Expo 52 | TypeScript code sharing with web, OTA updates, native performance |
| Design pipeline | Stitch (exploration) → Figma (convergence) | High-velocity concept generation followed by production-intent refinement |
| API contracts | OpenAPI 3.1 + Protobuf/Connect-ES | REST for simple surfaces, gRPC for high-throughput internal, Connect-ES for browser-native typed clients |
| Auth | Authentik OIDC + SpiceDB authorization | Dedicated identity provider with relationship-based access control |
| Observability | OpenTelemetry + Sentry + VictoriaStack | Vendor-neutral telemetry with production error tracking |
| Design tokens | Zod-validated JSON → CSS variables + Tailwind (web) / Tamagui themes (mobile) | Single source of truth flowing from Design-Factory_Figma through both experience repos |
| State management | TanStack Query (server state) + Zustand (client state) | Consistent pattern across web and mobile for data fetching and caching |
| Monorepo tooling | pnpm workspaces + Turborepo | Fast builds, workspace protocol linking, remote caching |

### Platform Numbers (Current State)

| Metric | Count |
|--------|-------|
| Repositories | 6 |
| Web applications | 3 (Software Factory, Platform Automation, Docs Portal) |
| Mobile application | 1 (Operator Companion) |
| Shared web packages | 10 (@bac/*) |
| Shared mobile packages | 7 (@bac-mobile/*) |
| UI components (web) | 27 |
| UI components (mobile) | 14 |
| Web routes | 50+ |
| Mobile screens | 35+ |
| Proto service definitions | 12 |
| OpenAPI endpoints | 30+ |
| GitHub Actions workflows | 16 across experience repos |
| Design token themes | 4 (enterprise dark/light, consumer dark/light) |

---

## 2. 3-Layer Ecosystem Model

```
┌──────────────────────────────────────────────────────────────────────┐
│                        DESIGN LAYER                                  │
│                                                                      │
│  ┌──────────────────────┐    ┌──────────────────────────┐           │
│  │  Design-Factory      │    │  Design-Factory           │           │
│  │  _Stitch             │───>│  _Figma                   │           │
│  │                      │    │                            │           │
│  │  Exploration &       │    │  Convergence &             │           │
│  │  concept generation  │    │  production-intent design  │           │
│  │                      │    │                            │           │
│  │  OUTPUTS:            │    │  OUTPUTS:                  │           │
│  │  - concept inventory │    │  - design tokens (JSON)    │           │
│  │  - screen maps       │    │  - route maps              │           │
│  │  - design briefs     │    │  - component specs         │           │
│  │  - handoff packs     │    │  - handoff exports         │           │
│  └──────────────────────┘    └──────────┬───────┬─────────┘           │
│                                         │       │                    │
└─────────────────────────────────────────┼───────┼────────────────────┘
                                          │       │
                    design tokens ────────┘       └─── route maps &
                    component specs                    component specs
                          │                                  │
┌─────────────────────────┼──────────────────────────────────┼─────────┐
│                   EXPERIENCE LAYER                          │         │
│                         │                                  │         │
│  ┌──────────────────────▼────────────┐  ┌─────────────────▼──────┐  │
│  │  AI-Frontend-Experience           │  │  AI-Companion-Mobile   │  │
│  │                                   │  │                        │  │
│  │  3 Next.js apps:                  │  │  1 Expo app:           │  │
│  │  - software-factory-web (:3000)   │  │  - operator-mobile     │  │
│  │  - platform-automation-web (:3001)│  │                        │  │
│  │  - docs-portal (:3002)            │  │  Screens:              │  │
│  │                                   │  │  - dashboard           │  │
│  │  10 shared @bac/* packages        │  │  - alerts/approvals    │  │
│  │                                   │  │  - incidents/runbooks  │  │
│  │  CONSUMES:                        │  │  - builds/workspaces   │  │
│  │  - OpenAPI specs                  │  │  - settings            │  │
│  │  - Proto/Connect-ES types         │  │                        │  │
│  │  - Design tokens                  │  │  7 @bac-mobile/* pkgs  │  │
│  │  - Route maps                     │  │                        │  │
│  │  - Component specs                │  │  CONSUMES:             │  │
│  │                                   │  │  - OpenAPI specs       │  │
│  │  PRODUCES:                        │  │  - Design tokens       │  │
│  │  - Docker images                  │  │  - Route maps          │  │
│  │  - Docs site                      │  │                        │  │
│  │  - Storybook                      │  │  PRODUCES:             │  │
│  └───────────────┬───────────────────┘  │  - iOS/Android builds  │  │
│                  │                      │  - OTA updates         │  │
│                  │                      └────────────┬───────────┘  │
└──────────────────┼───────────────────────────────────┼──────────────┘
                   │                                   │
                   │  HTTP/gRPC/WebSocket               │  HTTP/REST
                   │                                   │
┌──────────────────┼───────────────────────────────────┼──────────────┐
│            BACKEND / CONTROL LAYER                    │              │
│                  │                                   │              │
│  ┌───────────────▼───────────────┐  ┌────────────────▼──────────┐  │
│  │  AI-Software-Factory         │  │  AI-Platform-Automation   │  │
│  │  (NeuroForge SDX)            │  │  (BAC Control Plane)      │  │
│  │                              │  │                           │  │
│  │  Go services:                │  │  Go services + IaC:       │  │
│  │  - api-server                │  │  - api-server             │  │
│  │  - worker                    │  │  - worker                 │  │
│  │  - cli                       │  │  - cli                    │  │
│  │                              │  │                           │  │
│  │  Domains:                    │  │  Domains:                 │  │
│  │  - PRD intake                │  │  - tenancy                │  │
│  │  - architecture review       │  │  - workspace provisioning │  │
│  │  - code generation           │  │  - promises (Kratix)      │  │
│  │  - build/deploy              │  │  - GitOps rollout         │  │
│  │  - compliance                │  │  - observability          │  │
│  │  - quality gates             │  │  - policy/security        │  │
│  │  - agent orchestration       │  │  - incident management    │  │
│  │                              │  │  - quotas                 │  │
│  │  PRODUCES:                   │  │                           │  │
│  │  - OpenAPI 3.1 spec          │  │  PRODUCES:                │  │
│  │  - Proto/Connect-ES types    │  │  - OpenAPI 3.1 spec       │  │
│  │  - NATS events               │  │  - Proto types            │  │
│  │  - Swagger/compliance docs   │  │  - Hasura GraphQL         │  │
│  └──────────────────────────────┘  └───────────────────────────┘  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Layer Communication Rules

| Source Layer | Target Layer | Mechanism | Direction |
|-------------|-------------|-----------|-----------|
| Design → Experience | Design tokens, route maps, component specs | Downstream (publish → consume) |
| Backend → Experience | OpenAPI specs, Proto types, Connect-ES clients | Downstream (publish → consume) |
| Experience → Backend | HTTP/gRPC/WebSocket/GraphQL calls | Runtime (request → response) |
| Stitch → Figma | Concept handoff packs, screen inventories | Downstream (handoff → refine) |
| Software Factory → Platform | NATS JetStream events, Redpanda inter-region | Runtime (event bus) |
| Experience → Experience | Shared domain contracts (conceptual, not runtime) | Development-time alignment |

### Invariant Rules

1. **Design repos never call backend APIs.** They produce artifacts consumed by experience repos.
2. **Experience repos never write to backend databases.** All mutations flow through backend API contracts.
3. **Backend repos never import frontend/mobile code.** Contract artifacts are the only coupling surface.
4. **Stitch never produces production-intent designs.** Only explorations. Figma owns convergence.
5. **Mobile never replicates full web functionality.** It surfaces operational quick-actions only.
6. **Web never bundles mobile-specific code.** Shared types exist at contract level, not import level.

---

## 3. Role and Ownership of Each Repo

### 3.1 AI-Software-Factory

| Attribute | Value |
|-----------|-------|
| **Purpose** | AI-first software generation: PRD → production-ready services |
| **Owner** | Software Engineering Team |
| **Language** | Go |
| **Runtime** | Kubernetes (Helm + Fleet + KubeVela) |
| **Primary domains** | PRD intake, architecture review, code generation, build/deploy, compliance, quality gates, agent orchestration, audit |
| **API surface** | OpenAPI 3.1 (REST) + Protobuf/Connect-ES (gRPC-Web) |
| **Proto services** | 12: gateway, build, workitem, compliance, agent, artifact, audit, deploy, events, llm, quality, tenant |
| **Messaging** | NATS JetStream (regional), Redpanda (inter-regional) |
| **Data** | Hasura + PostgreSQL |
| **Search** | Meilisearch (product search), Qdrant (semantic search) |
| **Produces** | `software-factory-openapi`, `software-factory-proto`, `software-factory-connect-typescript` |
| **Consumers** | AI-Frontend-Experience, AI-Companion-Mobile |

### 3.2 AI-Platform-Automation

| Attribute | Value |
|-----------|-------|
| **Purpose** | BAC control plane: tenancy, provisioning, GitOps, policy, observability |
| **Owner** | Platform Engineering Team |
| **Language** | Go + Declarative IaC (Helm, Kustomize, Terraform, Crossplane, Kratix, KubeVela) |
| **Runtime** | Multi-cluster Kubernetes (Rancher + Fleet + kcp) |
| **Primary domains** | Tenancy, workspace provisioning, promises, GitOps rollout, observability, policy/security, incident management, quotas |
| **API surface** | OpenAPI 3.1 (REST) + Protobuf (control plane RPC) |
| **Data** | Hasura + PostgreSQL (via GraphQL subscriptions for real-time) |
| **Produces** | `platform-automation-openapi` |
| **Consumers** | AI-Frontend-Experience, AI-Companion-Mobile |

### 3.3 Design-Factory_Stitch

| Attribute | Value |
|-----------|-------|
| **Purpose** | High-velocity design exploration: product briefs → multi-screen UX concepts |
| **Owner** | Design Team (Exploration) |
| **Language** | Markdown, Python (tooling), prompt templates |
| **Primary outputs** | Concept inventories, screen maps, design briefs, handoff packs |
| **Pipeline** | 8-lane factory (Intake → Brief → Structure → Design DNA → Stitch Prompt → Export → Handoff → Review) |
| **Quality gates** | DESIGN.md standard, review framework, quality checklists |
| **Consumers** | Design-Factory_Figma (primary), Experience repos (screen maps) |
| **Does NOT produce** | Production-intent designs, tokens, or component specs |

### 3.4 Design-Factory_Figma

| Attribute | Value |
|-----------|-------|
| **Purpose** | Design convergence: Stitch concepts → production-intent Figma design systems |
| **Owner** | Design Team (Production) |
| **Language** | TypeScript (Fastify + Temporal workflows), Figma API |
| **Primary outputs** | Design tokens (Zod-validated JSON), route maps, component specs, handoff exports |
| **Token schema** | `color`, `typography`, `spacing`, `radius`, `elevation`, `components` with `brandMode: enterprise | consumer` |
| **Consumers** | AI-Frontend-Experience (tokens → CSS/Tailwind), AI-Companion-Mobile (tokens → Tamagui themes) |
| **Contract artifacts** | `figma-design-tokens`, `figma-web-route-map`, `figma-mobile-route-map`, `figma-component-specs-web`, `figma-component-specs-mobile` |

### 3.5 AI-Frontend-Experience

| Attribute | Value |
|-----------|-------|
| **Purpose** | Unified web experience layer for Software Factory + Platform Automation |
| **Owner** | Frontend Engineering Team |
| **Language** | TypeScript |
| **Framework** | Next.js 15 (App Router, RSC, standalone output) |
| **Monorepo** | pnpm workspaces + Turborepo |
| **Apps** | `software-factory-web` (:3000), `platform-automation-web` (:3001), `docs-portal` (:3002) |
| **Packages** | 10: `@bac/ui`, `@bac/auth`, `@bac/api-clients`, `@bac/config`, `@bac/design-tokens`, `@bac/observability`, `@bac/domain-contracts`, `@bac/i18n`, `@bac/testing`, `@bac/eslint-config` |
| **UI library** | 27 components (AppShell, DataTable, CommandPalette, etc.) |
| **Containerization** | Multi-stage Dockerfile, standalone Next.js output |
| **Consumes** | OpenAPI, Proto/Connect-ES, design tokens, route maps, component specs |

### 3.6 AI-Companion-Mobile

| Attribute | Value |
|-----------|-------|
| **Purpose** | Mobile companion: alerts, approvals, incidents, monitoring, quick actions |
| **Owner** | Mobile Engineering Team |
| **Language** | TypeScript |
| **Framework** | React Native + Expo 52 (Expo Router v4, file-based routing) |
| **Monorepo** | pnpm workspaces + Turborepo |
| **Apps** | `operator-mobile` (single app, multi-product) |
| **Packages** | 7: `@bac-mobile/ui-mobile`, `@bac-mobile/auth-mobile`, `@bac-mobile/api-mobile-clients`, `@bac-mobile/config`, `@bac-mobile/observability`, `@bac-mobile/i18n-mobile`, `@bac-mobile/testing` |
| **UI library** | Tamagui with 4 themes (enterprise dark/light, consumer dark/light) |
| **Distribution** | EAS Build (development, preview, staging, production profiles) |
| **Consumes** | OpenAPI, design tokens, route maps |

---

## 4. Why These Repo Boundaries Are Correct

### 4.1 Design Layer Separation (Stitch vs Figma)

**Why 2 design repos instead of 1:**

| Factor | Stitch | Figma |
|--------|--------|-------|
| **Purpose** | Divergent exploration | Convergent refinement |
| **Output fidelity** | Low-fi concepts | Production-intent specs |
| **Velocity** | High (many directions) | Measured (one direction) |
| **Tooling** | Prompt-driven, markdown | Figma API, Temporal workflows |
| **Audience** | Product/design stakeholders | Engineering consumers |
| **Lifecycle** | Disposable explorations | Versioned contract artifacts |

Merging them would conflate exploratory outputs with production contracts. The Stitch → Figma handoff pack is the explicit quality gate between exploration and commitment.

### 4.2 Backend Layer Separation (Software Factory vs Platform Automation)

**Why 2 backend repos instead of 1:**

| Factor | Software Factory | Platform Automation |
|--------|-----------------|-------------------|
| **Domain** | Software generation lifecycle | Infrastructure lifecycle |
| **Release cadence** | Feature-driven (weekly) | Stability-driven (biweekly) |
| **Blast radius** | Tenant workspaces | Entire platform |
| **Deployment topology** | Regional pods | Multi-cluster control plane |
| **Team** | Software engineering | Platform engineering |
| **Risk profile** | High iteration, lower blast | Low iteration, high blast |

Merging them would create a monolith with conflicting release cadences and risk profiles.

### 4.3 Experience Layer Separation (Web vs Mobile)

**Why 2 experience repos instead of 1:**

| Factor | Web | Mobile |
|--------|-----|--------|
| **Framework** | Next.js 15 (Node.js runtime) | Expo 52 (React Native runtime) |
| **Build system** | Dockerfile + standalone | EAS Build + OTA |
| **Testing** | Vitest + Playwright | Jest + Maestro |
| **Package namespace** | `@bac/*` | `@bac-mobile/*` |
| **UI library** | Tailwind + custom components | Tamagui + native components |
| **Deployment** | Container → Kubernetes | App Store + Google Play |
| **Functionality** | Full operator experience | Quick-action companion |

Merging them would create a build-system collision (Next.js standalone output vs Expo native builds) with no shared runtime benefit. Code sharing happens at the contract and type level, not the import level.

### 4.4 Why Not Merge Experience Into Backend Repos

| Concern | Why separate is correct |
|---------|----------------------|
| **Release cadence** | Frontend deploys 5-10x more frequently than backend |
| **Team ownership** | Frontend engineers should not need Go toolchains |
| **Build tooling** | pnpm/Turbo vs Go modules/Makefile |
| **Testing strategy** | Component/visual testing vs integration/contract/performance testing |
| **Deployment** | Container + CDN vs Helm + Fleet |
| **Blast radius** | UI bugs are low-blast; backend bugs are high-blast |

The contract-based integration model (consume specs, not source code) is the correct coupling mechanism.

---

## 5. Cross-Repo Contract Ownership Model

### 5.1 Ownership Matrix

| Contract Artifact | Producing Repo | Format | Versioning | Consumers |
|------------------|---------------|--------|-----------|-----------|
| `software-factory-openapi` | AI-Software-Factory | OpenAPI 3.1 YAML | `contracts/software-factory-openapi/v<semver>` | AI-Frontend-Experience, AI-Companion-Mobile |
| `software-factory-proto` | AI-Software-Factory | Protobuf (buf-managed) | `contracts/software-factory-proto/v<semver>` | AI-Frontend-Experience |
| `software-factory-connect-typescript` | AI-Software-Factory | Connect-ES TypeScript | `contracts/software-factory-connect-typescript/v<semver>` | AI-Frontend-Experience |
| `platform-automation-openapi` | AI-Platform-Automation | OpenAPI 3.1 YAML | `contracts/platform-automation-openapi/v<semver>` | AI-Frontend-Experience, AI-Companion-Mobile |
| `figma-design-tokens` | Design-Factory_Figma | Zod-validated JSON | `handoff/figma-design-tokens/v<semver>` | AI-Frontend-Experience, AI-Companion-Mobile |
| `figma-web-route-map` | Design-Factory_Figma | JSON manifest | `handoff/figma-web-route-map/v<semver>` | AI-Frontend-Experience |
| `figma-mobile-route-map` | Design-Factory_Figma | JSON manifest | `handoff/figma-mobile-route-map/v<semver>` | AI-Companion-Mobile |
| `figma-component-specs-web` | Design-Factory_Figma | JSON specs | `handoff/figma-component-specs-web/v<semver>` | AI-Frontend-Experience |
| `figma-component-specs-mobile` | Design-Factory_Figma | JSON specs | `handoff/figma-component-specs-mobile/v<semver>` | AI-Companion-Mobile |
| `stitch-concept-inventory` | Design-Factory_Stitch | Markdown + images | `handoff/stitch-concept-inventory/v<semver>` | Design-Factory_Figma |
| `stitch-screen-maps` | Design-Factory_Stitch | Markdown + JSON | `handoff/stitch-screen-maps/v<semver>` | Design-Factory_Figma, AI-Frontend-Experience |

### 5.2 Contract Rules

1. **Producers own schemas.** A consumer never modifies an upstream contract.
2. **Breaking changes require semver major bumps.** Consumers pin to `^major.minor` ranges.
3. **Contract validation runs in consumer CI.** Every PR validates against pinned upstream versions.
4. **Drift detection is automated.** `validate-contract-drift.mjs` compares local copy to upstream release.
5. **Compatibility reports are published.** `compatibility/manifest.json` tracks all consumer-producer version pairs.

### 5.3 Contract Flow Diagram

```
AI-Software-Factory                     AI-Platform-Automation
  │                                       │
  ├── api/openapi/openapi.yaml            ├── api/openapi/platform-automation-v1.openapi.yaml
  ├── api/proto/sdx/v1/*.proto            ├── api/proto/platform/v1/control_plane.proto
  │                                       │
  ▼ (GitHub Release tag)                  ▼ (GitHub Release tag)
  contracts/software-factory-*/v1.x       contracts/platform-automation-*/v1.x
  │                                       │
  ▼                                       ▼
AI-Frontend-Experience                   AI-Frontend-Experience
  contracts/upstreams/                    contracts/upstreams/
    ai-software-factory/                    ai-platform-automation/
      api/openapi/                            api/openapi/
      api/proto/                              api/proto/
  │                                       │
  ▼ (codegen)                             ▼ (codegen)
  packages/api-clients/src/generated/     packages/api-clients/src/platform/
    sdx/v1/*_connect.ts                     client.ts + subscriptions.ts


Design-Factory_Figma
  │
  ├── packages/contracts/src/schemas/tokens.ts
  ├── handoff/route-maps/
  ├── handoff/component-specs/
  │
  ▼ (GitHub Release tag)
  handoff/figma-design-tokens/v1.x
  handoff/figma-web-route-map/v1.x
  handoff/figma-mobile-route-map/v1.x
  │
  ├──────────────────────────────────────┐
  ▼                                      ▼
AI-Frontend-Experience                   AI-Companion-Mobile
  contracts/upstreams/                    contracts/upstreams/
    design-factory-figma/                   design-factory-figma/
      design-system/tokens/                   design-system/tokens/
  │                                       │
  ▼ (transform)                           ▼ (transform)
  packages/design-tokens/                 packages/ui-mobile/
    src/tokens/consumer.json                src/tokens/consumer.json
    src/tokens/enterprise.json              src/tokens/enterprise.json
  │                                       │
  ▼ (build)                               ▼ (build)
  CSS variables + Tailwind theme          Tamagui themes
```

---

## 6. Integration Flows Between All 6 Repos

### Flow 1: Design Exploration → Production Design

```
Design-Factory_Stitch
  1. Product brief lands in intake/
  2. Design DNA written (DESIGN.md)
  3. Stitch prompts generate concept inventory
  4. Screen maps define navigation structure
  5. Handoff pack assembled (exports + screen maps + design notes)
  ▼
Design-Factory_Figma
  6. Handoff pack imported into prompts/
  7. Figma workflows refine concepts into production components
  8. Design tokens extracted and Zod-validated
  9. Route maps and component specs published
  10. Release tagged: handoff/figma-*/v1.x
```

### Flow 2: Backend API → Frontend Client

```
AI-Software-Factory
  1. Domain model changes in internal/domain/
  2. Proto definitions updated in api/proto/sdx/v1/
  3. OpenAPI spec regenerated in api/openapi/
  4. CI runs openapi-drift workflow
  5. Release tagged: contracts/software-factory-*/v1.x
  ▼
AI-Frontend-Experience
  6. scripts/sync-proto-types.sh pulls new proto release
  7. scripts/sync-openapi-spec.sh pulls new OpenAPI release
  8. Connect-ES clients regenerated via buf + protoc-gen-connect-es
  9. packages/api-clients/src/generated/ updated
  10. Integration CI validates no breaking changes
  11. Apps consume via @bac/api-clients hooks
```

### Flow 3: Backend API → Mobile Client

```
AI-Platform-Automation
  1. Control plane API updated in api/openapi/
  2. Release tagged: contracts/platform-automation-openapi/v1.x
  ▼
AI-Companion-Mobile
  3. scripts/integration/generate-client-bindings.mjs pulls spec
  4. packages/api-mobile-clients/contracts/ updated
  5. Mock data in packages/api-mobile-clients/src/mock.ts updated
  6. Query hooks in packages/api-mobile-clients/src/index.tsx updated
  7. Integration CI validates compatibility
```

### Flow 4: Design Tokens → Web + Mobile

```
Design-Factory_Figma
  1. Token schema updated in packages/contracts/src/schemas/tokens.ts
  2. Tokens exported as JSON with brandMode (enterprise/consumer)
  3. Release tagged: handoff/figma-design-tokens/v1.x
  ▼
AI-Frontend-Experience                   AI-Companion-Mobile
  4a. scripts/sync-design-tokens.sh       4b. scripts/sync-design-tokens.sh
  5a. Tokens land in                      5b. Tokens land in
      packages/design-tokens/                 packages/ui-mobile/
        src/tokens/consumer.json                src/tokens/consumer.json
        src/tokens/enterprise.json              src/tokens/enterprise.json
  6a. transform.ts converts to            6b. tamagui.ts converts to
      CSS variables + Tailwind theme          Tamagui theme objects
  7a. CI runs design:validate             7b. CI runs design:validate
```

### Flow 5: Cross-Product Runtime Integration

```
At runtime, the experience layer communicates with the backend layer:

software-factory-web ──HTTP/Connect-ES──> AI-Software-Factory (api-server)
                      ──WebSocket────────> AI-Software-Factory (events)

platform-automation-web ──HTTP/REST──> AI-Platform-Automation (api-server)
                        ──GraphQL SSE──> Hasura (real-time subscriptions)

operator-mobile ──HTTP/REST──> AI-Software-Factory (api-server)
                ──HTTP/REST──> AI-Platform-Automation (api-server)
                ──Push──────> FCM/APNs (notifications)
```

### Flow 6: Incident Response (Cross-Layer)

```
AI-Platform-Automation detects incident
  1. Incident created in control plane
  2. NATS event: bac.platform.incident.created
  ▼
AI-Frontend-Experience
  3. platform-automation-web receives via GraphQL subscription
  4. Incident banner + detail page rendered
  ▼
AI-Companion-Mobile
  5. Push notification via FCM/APNs
  6. operator-mobile shows alert badge on Alerts tab
  7. Operator taps → incidents/[incidentId] detail screen
  8. Acknowledge action → PUT /v1/incidents/{id}/acknowledge
  ▼
AI-Platform-Automation
  9. Incident state updated
  10. NATS event: bac.platform.incident.acknowledged
```

---

## 7. API Contract Model

### 7.1 Software Factory API Surface

| Service | Transport | Path/Package | Methods |
|---------|-----------|-------------|---------|
| Gateway | Connect-ES | `sdx.v1.GatewayService` | CreateProject, GetProject, ListProjects |
| WorkItem | Connect-ES | `sdx.v1.WorkItemService` | CreateWorkItem, GetWorkItem, ListWorkItems, UpdateWorkItem |
| Build | Connect-ES | `sdx.v1.BuildService` | TriggerBuild, GetBuild, ListBuilds, CancelBuild |
| Compliance | Connect-ES | `sdx.v1.ComplianceService` | RunComplianceCheck, GetComplianceReport |
| Agent | Connect-ES | `sdx.v1.AgentService` | StartAgent, StopAgent, GetAgentStatus |
| Artifact | Connect-ES | `sdx.v1.ArtifactService` | GetArtifact, ListArtifacts, DownloadArtifact |
| Audit | Connect-ES | `sdx.v1.AuditService` | GetAuditLog, ListAuditEntries |
| Deploy | Connect-ES | `sdx.v1.DeployService` | TriggerDeploy, GetDeployStatus, RollbackDeploy |
| LLM | Connect-ES | `sdx.v1.LLMService` | Prompt, StreamPrompt, GetModelStatus |
| Quality | Connect-ES | `sdx.v1.QualityService` | RunQualityGate, GetQualityReport |
| Tenant | Connect-ES | `sdx.v1.TenantService` | GetTenant, ListTenants, UpdateTenant |
| Events | Connect-ES | `sdx.v1.EventService` | StreamEvents, GetEventHistory |
| REST | OpenAPI 3.1 | `/api/v1/*` | Full CRUD surface mirroring Connect-ES |
| Swagger | OpenAPI 3.1 | `/api/docs` | Interactive Swagger UI |

### 7.2 Platform Automation API Surface

| Resource | Method | Path | Purpose |
|----------|--------|------|---------|
| Summary | GET | `/v1/control-plane/summary` | Platform health overview |
| Regions | GET/POST | `/v1/regions` | Region management |
| Clusters | GET/POST | `/v1/clusters` | Cluster lifecycle |
| Workspaces | GET/POST/PUT | `/v1/workspaces` | Workspace CRUD |
| Promises | GET/POST | `/v1/promises` | Kratix promise management |
| Incidents | GET/POST/PUT | `/v1/incidents` | Incident lifecycle |
| Policy | GET | `/v1/policy/summary` | Policy compliance summary |
| Quotas | GET/PUT | `/v1/quotas` | Resource quota management |
| Identity | GET/POST | `/v1/identity` | Authentik user/group management |
| Observability | GET | `/v1/observability` | Metrics and alerts |
| GitOps | GET/POST | `/v1/gitops` | Fleet/ArgoCD sync status |
| Runbooks | GET | `/v1/runbooks` | Operational runbook catalog |

### 7.3 Shared API Conventions

| Convention | Standard |
|-----------|----------|
| **Pagination** | Cursor-based: `pageSize`, `cursor`, `sort`, `filter`, `includeTotal` |
| **Error model** | `{ code, message, status, category, requestId, retryable, details }` |
| **Auth header** | `Authorization: Bearer <jwt>` with Authentik-issued tokens |
| **Tenant context** | `X-Bac-Tenant-Id`, `X-Bac-Workspace-Id`, `X-Bac-Region` headers |
| **API versioning** | URL path prefix: `/v1/`, `/v2/` |
| **Event naming** | `bac.<domain>.<resource>.<action>` (e.g., `bac.sdx.build.completed`) |
| **Rate limiting** | Token bucket per tenant, headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining` |

---

## 8. Design Handoff Model

### 8.1 Pipeline

```
                    STITCH LANE                        FIGMA LANE
                    ──────────                         ──────────
Product Brief ──> Screen Map ──> DESIGN.md ──> Concept Export ──> Figma Refinement
                                                        │
                                                        ▼
                                                   Token Extraction
                                                        │
                                              ┌─────────┼─────────┐
                                              ▼         ▼         ▼
                                          Tokens    Route Map   Component
                                          (JSON)    (JSON)      Specs (JSON)
                                              │         │         │
                                              ▼         ▼         ▼
                                    ┌─────────────────────────────────┐
                                    │     Release Tagged Artifacts     │
                                    │  handoff/figma-*/v<semver>       │
                                    └────────────┬────────────────────┘
                                                 │
                                    ┌────────────┼────────────┐
                                    ▼                         ▼
                              Web Consumers              Mobile Consumers
                        (CSS vars + Tailwind)        (Tamagui themes)
```

### 8.2 Token Schema (Authoritative)

The Zod schema in `Design-Factory_Figma/packages/contracts/src/schemas/tokens.ts` is the single source of truth:

```
TokensSchema {
  brandMode: "enterprise" | "consumer"
  color: {
    primary, secondary, accent,
    background, surface, text,
    success, warning, danger
  }
  typography: {
    display, heading, body, mono,
    scale: { xs, sm, md, lg, xl, 2xl }
  }
  spacing: { xs, sm, md, lg, xl }
  radius: { sm, md, lg, pill }
  elevation: { low, medium, high }
  components: {
    appShell: { navWidth, headerHeight }
    card: { padding, gap }
    table: { rowHeight, headerHeight }
    form: { fieldHeight, fieldGap }
  }
}
```

### 8.3 Token Transformation

| Target | Package | Transform | Output |
|--------|---------|-----------|--------|
| Web CSS | `@bac/design-tokens` | `tokenSetToCssVariables()` | `--bac-color-primary: #xxx` CSS custom properties |
| Web Tailwind | `@bac/design-tokens` | `tokenSetToTailwindTheme()` | Tailwind `extend.colors` / `extend.spacing` |
| Mobile Tamagui | `@bac-mobile/ui-mobile` | `createThemeFromTokens()` | Tamagui theme objects with `bacDark`, `bacLight`, `consumerDark`, `consumerLight` |

### 8.4 Design Traceability

Every UI surface in both experience repos traces back to a design artifact:

```
Figma Component Spec (component-specs/web/*.json)
  ↓ maps to
@bac/ui component (packages/ui/src/components/*.tsx)
  ↓ used in
Route page (apps/software-factory-web/app/(app)/software-factory/dashboard/page.tsx)
  ↓ renders with
Design tokens (packages/design-tokens/src/tokens/enterprise.json)
  ↓ sourced from
Design-Factory_Figma handoff (handoff/figma-design-tokens/v1.x)
  ↓ refined from
Design-Factory_Stitch concept (exports/concept-inventory/*)
```

---

## 9. Generated Client Model

### 9.1 Web Client Generation Pipeline

```
SOURCE: AI-Software-Factory/api/proto/sdx/v1/*.proto
  │
  ▼ buf generate (buf.gen.yaml in contracts/upstreams/ai-software-factory/)
  │
  ▼ protoc-gen-connect-es + protoc-gen-es
  │
  ▼ OUTPUT: packages/api-clients/src/generated/sdx/v1/
      ├── gateway_connect.ts
      ├── build_connect.ts
      ├── workitem_connect.ts
      ├── compliance_connect.ts
      ├── agent_connect.ts
      ├── artifact_connect.ts
      ├── audit_connect.ts
      ├── deploy_connect.ts
      ├── events_connect.ts
      ├── llm_connect.ts
      ├── quality_connect.ts
      ├── tenant_connect.ts
      └── contract-registry.ts

SOURCE: AI-Platform-Automation/api/openapi/platform-automation-v1.openapi.yaml
  │
  ▼ Custom HTTP client (packages/api-clients/src/platform/client.ts)
  │  (Hasura GraphQL client + REST wrapper)
  │
  ▼ OUTPUT: packages/api-clients/src/platform/
      ├── client.ts         (REST + GraphQL)
      └── subscriptions.ts  (GraphQL SSE subscriptions)
```

### 9.2 Mobile Client Generation Pipeline

```
SOURCE: AI-Software-Factory/api/openapi/openapi.yaml
SOURCE: AI-Platform-Automation/api/openapi/platform-automation-v1.openapi.yaml
  │
  ▼ scripts/integration/generate-client-bindings.mjs
  │
  ▼ OUTPUT: packages/api-mobile-clients/
      ├── src/index.tsx          (TanStack Query hooks: useDashboardSummary,
      │                           useAlerts, useApprovals, useIncidents,
      │                           useBuilds, useWorkItems, useClusters,
      │                           useWorkspaces, useRunbooks, useAuditLog,
      │                           useQuickActions + mutation hooks)
      ├── src/generated/
      │     └── contract-registry.ts
      ├── src/mock.ts            (Development mock data)
      ├── src/persistence.ts     (AsyncStorage offline cache)
      └── contracts/             (Synced upstream specs)
```

### 9.3 Client Consumption Pattern

**Web (Connect-ES with TanStack Query):**

```typescript
// packages/api-clients/src/hooks.tsx provides the QueryClient
// Apps consume via generated service clients:
import { useQuery } from '@tanstack/react-query';
import { createPromiseClient } from '@connectrpc/connect';
import { BuildService } from '@bac/api-clients/generated/sdx/v1/build_connect';

// Direct Connect-ES typed client usage
const client = createPromiseClient(BuildService, transport);
const builds = await client.listBuilds({ workspaceId, cursor, pageSize });
```

**Mobile (TanStack Query with mock-first):**

```typescript
// packages/api-mobile-clients/src/index.tsx provides hooks
import { useBuilds, useApproveDecision } from '@bac-mobile/api-mobile-clients';

// Hook-based consumption
const { data, isLoading } = useBuilds(workspaceId);
const { mutateAsync: approve } = useApproveDecision();
```

---

## 10. CI/CD and Release Model

### 10.1 Workflow Inventory

| Repo | Workflow | Trigger | Purpose |
|------|----------|---------|---------|
| AI-Software-Factory | `pr.yml` | PR | Lint, test, build |
| AI-Software-Factory | `push.yml` | Push to main | Full check suite |
| AI-Software-Factory | `release.yml` | Tag | Helm release + contract publish |
| AI-Software-Factory | `openapi-drift.yml` | PR | Detect spec drift |
| AI-Software-Factory | `container-scan.yml` | Push | Trivy scan |
| AI-Software-Factory | `sbom.yml` | Release | Generate SBOM |
| AI-Platform-Automation | `release.yml` | Tag | Contract publish |
| AI-Platform-Automation | `integration.yml` | PR/Push | Cross-repo validation |
| AI-Frontend-Experience | `pr.yml` | PR | Lint, typecheck, test, build |
| AI-Frontend-Experience | `push.yml` | Push to main | Full pnpm check |
| AI-Frontend-Experience | `release.yml` | Manual | Docker build all 3 apps |
| AI-Frontend-Experience | `preview.yml` | PR | Vercel/preview deployment |
| AI-Frontend-Experience | `a11y.yml` | PR/Manual | Accessibility audit |
| AI-Frontend-Experience | `bundle-analysis.yml` | PR | Bundle size analysis |
| AI-Frontend-Experience | `integration.yml` | PR/Push | Contract sync + validation |
| AI-Frontend-Experience | `docker.yml` | Push | Container builds |
| AI-Companion-Mobile | `ci.yml` | PR/Push | Lint, typecheck, test, build |
| AI-Companion-Mobile | `preview-build.yml` | Push/Manual | EAS preview builds |
| AI-Companion-Mobile | `integration.yml` | PR/Push | Contract sync + validation |
| AI-Companion-Mobile | `e2e.yml` | Push/Manual | Maestro E2E tests |

### 10.2 Release Flow

```
Backend Release (Upstream)
  1. Feature branch → PR → review → merge to main
  2. Version tag: v1.x.x
  3. CI publishes contract artifacts:
     - contracts/software-factory-openapi/v1.x.x (GitHub Release)
     - contracts/software-factory-proto/v1.x.x
     - contracts/software-factory-connect-typescript/v1.x.x
  4. Container image pushed: ghcr.io/stratogroup/sdx-api:v1.x.x

Consumer Sync (Downstream)
  5. integration.yml in experience repos detects new upstream release
  6. scripts/sync-*.sh pulls new contract artifacts
  7. Client regeneration runs
  8. Compatibility matrix updated
  9. PR auto-created with contract update
  10. CI validates no breaking changes

Web Release
  11. Feature branch → PR → preview deployment → review → merge
  12. semantic-release creates version tag
  13. Docker images built for all 3 apps:
      - ghcr.io/stratogroup/bac-software-factory-web:v1.x.x
      - ghcr.io/stratogroup/bac-platform-automation-web:v1.x.x
      - ghcr.io/stratogroup/bac-docs-portal:v1.x.x
  14. Helm values updated → Fleet sync → rollout

Mobile Release
  15. Feature branch → PR → CI → review → merge
  16. EAS Build triggered (preview → staging → production profiles)
  17. OTA update published for minor changes
  18. App Store / Google Play submission for major changes
```

### 10.3 Semantic Versioning Rules

| Change Type | Version Bump | Examples |
|------------|-------------|---------|
| Breaking API change | Major | Remove endpoint, change request schema |
| New feature | Minor | Add endpoint, add optional field |
| Bug fix | Patch | Fix response format, fix validation |
| Design token change | Minor (additive) / Major (breaking) | New color → minor; rename color → major |
| Route addition | Minor | New page route |
| Route removal | Major | Remove page route |

---

## 11. Compatibility Matrix Model

### 11.1 Matrix Structure

Each experience repo maintains a `compatibility/manifest.json`:

```json
{
  "consumer": "ai-frontend-experience",
  "version": "0.1.0",
  "upstreams": {
    "ai-software-factory": {
      "openapi": { "pinned": "1.2.0", "compatible": "^1.0.0" },
      "proto": { "pinned": "1.2.0", "compatible": "^1.0.0" },
      "connect-typescript": { "pinned": "1.2.0", "compatible": "^1.0.0" }
    },
    "ai-platform-automation": {
      "openapi": { "pinned": "1.1.0", "compatible": "^1.0.0" }
    },
    "design-factory-figma": {
      "design-tokens": { "pinned": "1.0.0", "compatible": "^1.0.0" },
      "web-route-map": { "pinned": "1.0.0", "compatible": "^1.0.0" },
      "component-specs-web": { "pinned": "1.0.0", "compatible": "^1.0.0" }
    }
  },
  "validatedAt": "2026-03-23T00:00:00Z"
}
```

### 11.2 Validation Rules

1. **Pinned version must exist** as a published GitHub Release tag in the upstream repo.
2. **Compatible range must not include breaking changes** — validated by schema diff.
3. **All consumer-side generated code must compile** against the pinned upstream version.
4. **Design token Zod validation must pass** — upstream tokens parsed against consumer schema.
5. **Route map coverage must be ≥ 95%** — all design routes implemented in app router.

### 11.3 Compatibility CI Job

```
integration.yml:
  1. Fetch latest upstream releases
  2. Compare against pinned versions
  3. If newer minor/patch available:
     a. Pull new artifact
     b. Run codegen
     c. Run typecheck
     d. Run tests
     e. Update compatibility/manifest.json
     f. Create PR with "[contracts] Bump <upstream> to v<version>"
  4. If newer major available:
     a. Log warning
     b. Do NOT auto-update
     c. Create issue: "Breaking upstream change: <upstream> v<version>"
```

---

## 12. Local Development and Integration Model

### 12.1 Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ≥ 20.10.0 | Runtime |
| pnpm | 9.15.9 | Package manager |
| Docker | ≥ 24 | Container builds |
| Go | ≥ 1.22 | Backend development (optional) |
| buf | Latest | Proto compilation |
| Expo CLI | ≥ 52 | Mobile development |
| EAS CLI | ≥ 12.6.2 | Mobile builds |

### 12.2 Web Development Setup

```bash
# Clone and install
git clone https://github.com/stratogroup/AI-Frontend-Experience
cd AI-Frontend-Experience
pnpm install

# Start all 3 apps in parallel
pnpm dev

# Individual apps
pnpm --filter @bac/software-factory-web dev     # :3000
pnpm --filter @bac/platform-automation-web dev   # :3001
pnpm --filter @bac/docs-portal dev               # :3002

# Storybook
pnpm --filter @bac/ui storybook                  # :6006

# Full check (lint + typecheck + test + build)
pnpm check
```

### 12.3 Mobile Development Setup

```bash
# Clone and install
git clone https://github.com/stratogroup/AI-Companion-Mobile
cd AI-Companion-Mobile
pnpm install

# Start Expo dev server
pnpm dev                                         # :8081

# Run on iOS simulator
pnpm --filter @bac-mobile/operator-mobile ios

# Run on Android emulator
pnpm --filter @bac-mobile/operator-mobile android

# Full check
pnpm check
```

### 12.4 Mock Mode

Both experience repos support full mock-mode development without backend connectivity:

**Web:** Set `NEXT_PUBLIC_BAC_ENABLE_MOCK_API=true` in `.env.local`
- `@bac/api-clients` returns mock datasets from `src/mock/data.ts`
- Auth mock: "Continue with operator session" button on login page
- All routes render with mock data

**Mobile:** Set `EXPO_PUBLIC_BAC_ENABLE_MOCK_API=true` in EAS profile
- `@bac-mobile/api-mobile-clients` returns mock datasets from `src/mock.ts`
- Auth mock: local session with configurable role
- All screens render with mock data

### 12.5 Contract Sync (Local)

```bash
# Web repo — sync all upstream contracts
pnpm contracts:generate

# Individual syncs
pnpm sync:proto        # Proto types from AI-Software-Factory
pnpm sync:openapi      # OpenAPI specs from both backends
pnpm sync:tokens       # Design tokens from Design-Factory_Figma

# Mobile repo — sync all upstream contracts
pnpm contracts:generate

# Validate design token drift
pnpm design:validate
```

### 12.6 Cross-Repo Local Development

When developing against local backend changes:

```bash
# Terminal 1: Run backend (AI-Software-Factory)
cd AI-Software-Factory/neuroforge-sdx
make run-api

# Terminal 2: Run web frontend with local API
cd AI-Frontend-Experience
NEXT_PUBLIC_BAC_API_BASE_URL=http://localhost:8080 pnpm dev

# Terminal 3: Run mobile with local API
cd AI-Companion-Mobile
EXPO_PUBLIC_BAC_API_BASE_URL=http://localhost:8080 pnpm dev
```

---

## 13. Deployment Model

### 13.1 Web Deployment (AI-Frontend-Experience)

| Environment | Trigger | Infrastructure | URL Pattern |
|------------|---------|---------------|-------------|
| **Preview** | PR created | Vercel preview / k8s ephemeral namespace | `pr-<number>.preview.bac.io` |
| **Staging** | Merge to main | Kubernetes (Fleet-managed) | `staging.bac.io` |
| **Production** | Release tag | Kubernetes (Fleet-managed, canary) | `app.bac.io` |

**Container Build:**
```dockerfile
# Multi-stage: deps → builder → runner
# Build arg: APP_NAME selects which app to build
# Output: standalone Next.js in /app/.next/standalone
# Health: /api/health
# User: nextjs (UID 1001)
# Base: node:20-alpine
```

**Kubernetes Resources (per app):**
- Deployment (2-4 replicas, rolling update)
- Service (ClusterIP)
- Ingress (with TLS via cert-manager)
- HPA (CPU/memory-based autoscaling)
- PodDisruptionBudget (minAvailable: 1)

### 13.2 Mobile Deployment (AI-Companion-Mobile)

| Environment | Trigger | Distribution | Channel |
|------------|---------|-------------|---------|
| **Development** | Local | Expo Go / Dev Client | `development` |
| **Preview** | PR / Manual | Internal (TestFlight / Firebase) | `preview` |
| **Staging** | Merge to main | Internal (TestFlight / Firebase) | `staging` |
| **Production** | Release tag | App Store + Google Play | `production` |

**EAS Build Profiles:**
```json
{
  "development": { "developmentClient": true, "distribution": "internal" },
  "preview": { "distribution": "internal", "channel": "preview" },
  "staging": { "distribution": "internal", "channel": "staging" },
  "production": { "distribution": "store", "channel": "production" }
}
```

**OTA Updates:**
- Minor fixes: EAS Update (instant, no app store review)
- Major changes: Full native build + store submission
- Rollback: Revert to previous update branch

### 13.3 Backend Deployment (Reference)

| Repo | Packaging | Orchestration | Strategy |
|------|-----------|--------------|----------|
| AI-Software-Factory | Helm chart + Docker | Fleet + KubeVela | Canary (10% → 50% → 100%) |
| AI-Platform-Automation | Helm + Kustomize + Terraform | Fleet + Crossplane + Kratix | Blue-green per region |

### 13.4 Design Deployment

Design repos do not deploy runtime services. They publish artifacts:

| Repo | Publication | Target |
|------|------------|--------|
| Design-Factory_Stitch | GitHub Release (handoff packs) | Design-Factory_Figma |
| Design-Factory_Figma | GitHub Release (tokens, route maps, specs) | Experience repos |

---

## 14. Governance Model

### 14.1 Code Ownership (CODEOWNERS)

**AI-Frontend-Experience:**
```
# Global
*                              @stratogroup/frontend-leads

# Apps
apps/software-factory-web/     @stratogroup/sdx-frontend
apps/platform-automation-web/  @stratogroup/platform-frontend
apps/docs-portal/              @stratogroup/docs-team

# Shared packages
packages/auth/                 @stratogroup/security-frontend
packages/api-clients/          @stratogroup/api-team
packages/design-tokens/        @stratogroup/design-engineering
packages/ui/                   @stratogroup/design-engineering
packages/observability/        @stratogroup/sre-frontend
packages/config/               @stratogroup/frontend-leads

# Contracts
contracts/                     @stratogroup/architecture
```

**AI-Companion-Mobile:**
```
# Global
*                              @stratogroup/mobile-leads

# App
apps/operator-mobile/          @stratogroup/mobile-team

# Shared packages
packages/auth-mobile/          @stratogroup/security-mobile
packages/api-mobile-clients/   @stratogroup/api-team
packages/ui-mobile/            @stratogroup/design-engineering
packages/config/               @stratogroup/mobile-leads

# Contracts
contracts/                     @stratogroup/architecture
```

### 14.2 PR Review Rules

| Change Scope | Required Reviewers | Approval Count |
|-------------|-------------------|----------------|
| App-only change | App team | 1 |
| Shared package change | Package owner + 1 app consumer | 2 |
| Contract update | Architecture team + affected consumers | 2 |
| Auth/security change | Security team | 2 |
| Design token change | Design engineering + architecture | 2 |
| CI/CD workflow change | DevOps + architecture | 2 |
| Breaking change (major) | Architecture + all affected teams | 3 |

### 14.3 Branch Strategy

| Branch | Purpose | Protection |
|--------|---------|-----------|
| `main` | Production-ready code | Require PR, CI pass, review approval |
| `feat/*` | Feature development | No protection |
| `fix/*` | Bug fixes | No protection |
| `contracts/*` | Contract updates | Require architecture review |
| `release/*` | Release candidates | Require 2 approvals |

### 14.4 Engineering Doctrine

All 6 repos follow the BAC engineering doctrine:

| Practice | Standard |
|----------|----------|
| **XP** | Pair programming, continuous integration, small releases |
| **TDD** | Tests written before production code |
| **DDD** | Domain boundaries enforced at package/module level |
| **AIDD** | AI-assisted development with human oversight |

### 14.5 Quality Gates

| Gate | When | Pass Criteria |
|------|------|---------------|
| **Lint** | Every PR | Zero ESLint/golint errors |
| **Type check** | Every PR | Zero TypeScript/Go compile errors |
| **Unit tests** | Every PR | 100% pass, ≥ 80% coverage |
| **Contract validation** | Every PR touching contracts/ | Compatibility matrix green |
| **Design validation** | Every PR touching design-tokens/ | Zod schema validation pass |
| **Bundle analysis** | Every PR (web) | No regression > 5% |
| **Accessibility** | Every PR (web) | WCAG 2.1 AA compliance |
| **Security scan** | Every PR | No critical/high CVEs |
| **E2E** | Pre-release | All Maestro/Playwright flows pass |
| **Performance** | Pre-release | LCP < 2.5s, FID < 100ms |

---

## 15. ADR List

### ADR-001: Separate Frontend and Mobile Repositories

**Status:** Accepted
**Context:** The web and mobile experience layers share TypeScript and React as a language/paradigm but differ in runtime (Node.js vs React Native), build system (Next.js standalone vs EAS Build), UI framework (Tailwind vs Tamagui), and deployment target (Kubernetes vs App Store/Play Store).
**Decision:** Maintain AI-Frontend-Experience and AI-Companion-Mobile as separate repositories with separate pnpm workspaces and separate package namespaces (`@bac/*` vs `@bac-mobile/*`).
**Consequences:** Code sharing happens at the contract and type level (Zod schemas, API types), not at the import level. Each repo has its own build pipeline, test suite, and release cadence. This eliminates build-system collisions and allows independent scaling of web and mobile teams.

### ADR-002: Do Not Merge Frontend Into Backend Repositories

**Status:** Accepted
**Context:** Backend repos use Go with Makefile-driven builds. Frontend repos use TypeScript with pnpm/Turbo-driven builds. Release cadences differ: frontend deploys 5-10x more frequently.
**Decision:** Keep experience layer repos separate from backend repos. Connect them via versioned contract artifacts.
**Consequences:** Frontend engineers do not need Go toolchains. Backend engineers do not need Node.js toolchains. Contract-based integration is the only coupling surface. Breaking changes are detected by compatibility matrices, not by shared-repo CI failures.

### ADR-003: Next.js 15 with App Router for Web

**Status:** Accepted
**Context:** Evaluated Next.js (App Router), Remix, Vite + React Router, and Astro for the web experience layer.
**Decision:** Next.js 15 with App Router, React Server Components, and standalone output mode.
**Consequences:** Server-side rendering for initial load performance. File-based routing with route groups for product separation. Standalone output for Docker containerization. React 19 features (Server Components, Suspense boundaries). Ecosystem maturity for enterprise deployment.

### ADR-004: React Native + Expo Over Flutter for Mobile

**Status:** Accepted
**Context:** Flutter offers performance and cross-platform UI consistency. React Native + Expo offers TypeScript code sharing with the web layer, shared mental models (React component model, hooks), and TanStack Query for data fetching parity.
**Decision:** React Native + Expo 52 with Expo Router v4.
**Consequences:** TypeScript across the entire experience layer. Shared Zod schemas, API types, and domain contracts between web and mobile. Expo Router's file-based routing matches Next.js App Router mental model. EAS Build/Update for CI/CD. Trade-off: slightly less pixel-perfect cross-platform UI than Flutter.

### ADR-005: Authentik OIDC + SpiceDB for Auth/AuthZ

**Status:** Accepted
**Context:** The platform requires multi-tenant authentication with role-based and relationship-based access control across web and mobile.
**Decision:** Authentik as the OIDC identity provider. SpiceDB for fine-grained authorization. Signed HTTP-only cookies for web session management. Expo Secure Store for mobile token storage. Biometric unlock for mobile.
**Consequences:** Web uses OIDC authorization code flow with PKCE. Mobile uses expo-auth-session for native OIDC PKCE. Both share a unified role taxonomy (VIEWER, MEMBER, ADMIN, PLATFORM_ADMIN, OPERATOR, APPROVER, EXECUTIVE, SUPPORT_ENGINEER, COMPLIANCE_REVIEWER). Permission checks are consistent across platforms via `@bac/auth` and `@bac-mobile/auth-mobile`.

### ADR-006: Connect-ES + OpenAPI for API Client Generation

**Status:** Accepted
**Context:** The Software Factory exposes both gRPC (for internal high-throughput) and REST (for browser consumption). The Platform Automation exposes REST + GraphQL (via Hasura).
**Decision:** Use Connect-ES (Buf) to generate browser-native TypeScript clients from Protobuf definitions for Software Factory. Use OpenAPI 3.1 specs with custom HTTP clients for Platform Automation. Wrap both in TanStack Query hooks.
**Consequences:** Web gets fully typed Connect-ES clients for SDX services (12 service stubs). Platform Automation uses a custom Hasura GraphQL client with SSE subscriptions. Mobile uses REST-only clients generated from OpenAPI specs. All clients support mock-mode for offline development.

### ADR-007: Design Tokens Flow from Figma Through Zod Validation

**Status:** Accepted
**Context:** Design tokens must flow from Design-Factory_Figma to both experience repos with schema validation and transformation to platform-specific formats.
**Decision:** Design-Factory_Figma publishes Zod-validated JSON tokens. Web transforms to CSS custom properties + Tailwind theme extensions. Mobile transforms to Tamagui theme objects. Both repos run `design:validate` in CI to detect drift.
**Consequences:** Single source of truth for design decisions. Schema validation catches token changes before they reach consumers. Four themes supported: enterprise dark/light, consumer dark/light. Token sync is automated via `sync-design-tokens.sh`.

### ADR-008: TanStack Query + Zustand for State Management

**Status:** Accepted
**Context:** Both web and mobile need server-state caching with offline support and minimal client-side state.
**Decision:** TanStack Query v5 for all server state (API data, real-time subscriptions). Zustand for ephemeral client state (UI state, form state). No Redux.
**Consequences:** Consistent data-fetching pattern across web and mobile. Offline-first with configurable stale/gc times. Mobile uses AsyncStorage persister for offline cache. Web uses in-memory cache. Mutation hooks with optimistic updates. Mock data injected at the query level for development.

### ADR-009: Turborepo for Monorepo Orchestration

**Status:** Accepted
**Context:** Both experience repos are pnpm monorepos with multiple apps and shared packages. Build orchestration must handle dependency graphs, caching, and parallel execution.
**Decision:** Turborepo with remote caching enabled.
**Consequences:** `turbo.json` defines task pipelines with dependency ordering. Remote cache accelerates CI (cache hits skip builds). `pnpm-workspace.yaml` with `workspace:*` protocol for internal dependencies. Each package has its own `package.json`, `tsconfig.json`, and build target.

### ADR-010: Semantic Release for Versioning

**Status:** Accepted
**Context:** Need automated version bumps, changelog generation, and release tagging based on conventional commits.
**Decision:** semantic-release with conventional-changelog-conventionalcommits preset.
**Consequences:** Commit messages drive version bumps (feat → minor, fix → patch, BREAKING CHANGE → major). Changelogs auto-generated. Release tags auto-created. `.releaserc.json` configures plugins for changelog, git, and GitHub release.

### ADR-011: EAS Build for Mobile Distribution

**Status:** Accepted
**Context:** Mobile builds require native compilation (iOS/Android) with multiple distribution channels.
**Decision:** Expo Application Services (EAS) for build, update, and submit.
**Consequences:** Four build profiles: development (dev client), preview (internal), staging (internal), production (store). OTA updates via EAS Update for JavaScript-only changes. App Store/Google Play submission via EAS Submit. Environment variables per profile.

### ADR-012: Storybook for Component Documentation

**Status:** Accepted
**Context:** The shared UI library (`@bac/ui`) needs visual documentation, interaction testing, and accessibility auditing.
**Decision:** Storybook 8 with `@storybook/nextjs` framework, `addon-essentials`, and `addon-a11y`.
**Consequences:** Every component has a `.stories.tsx` file. Storybook runs on `:6006`. Accessibility violations flagged in component stories. Visual regression testing possible with Chromatic integration.

### ADR-013: Separate Design Repos (Stitch vs Figma)

**Status:** Accepted
**Context:** Design work has two distinct phases: exploration (generating many directions) and convergence (refining one direction to production intent).
**Decision:** Design-Factory_Stitch owns exploration. Design-Factory_Figma owns convergence. The handoff pack is the interface between them.
**Consequences:** Stitch can iterate rapidly without affecting production designs. Figma produces versioned, schema-validated artifacts consumed by engineering. The 8-lane pipeline in Stitch feeds quality-gated handoffs into Figma's Temporal workflows.

### ADR-014: Multi-Region Support

**Status:** Accepted
**Context:** BAC platform operates across multiple regions (ng, za, eu) with region-specific API endpoints.
**Decision:** Both experience repos support multi-region configuration. Web uses `@bac/config` regions. Mobile uses `@bac-mobile/config` regions. Region selection affects API base URL, tenant context, and data residency.
**Consequences:** Region configuration is Zod-validated. Web sends `X-Bac-Region` header on all API calls. Mobile stores region preference in Secure Store. Region switching is a runtime operation, not a rebuild.

### ADR-015: Offline-First Mobile Architecture

**Status:** Accepted
**Context:** Mobile operators may have intermittent connectivity in field environments.
**Decision:** TanStack Query with AsyncStorage persister for offline data cache. Network-mode: `offlineFirst`. Feature-flagged via `offlinePersistence`.
**Consequences:** Cached data available offline. Mutations queue when offline and replay on reconnect. Stale data indicators shown to users. Cache invalidation on reconnect. Storage bounded by `gcTime` (30 minutes default).

### ADR-016: Containerized Web Deployment with Fleet

**Status:** Accepted
**Context:** Web applications need container-based deployment with GitOps-driven rollout across environments.
**Decision:** Multi-stage Dockerfile producing standalone Next.js containers. Fleet (Rancher) for GitOps sync. Helm values per environment.
**Consequences:** Each web app builds to a ~100MB Alpine container. Health checks via `/api/health`. Non-root user (UID 1001). Fleet watches Helm values repo for rollout triggers. Canary deployments via progressive rollout.

### ADR-017: Maestro for Mobile E2E Testing

**Status:** Accepted
**Context:** Mobile E2E testing options include Detox, Appium, and Maestro. Need native UI flow testing with low maintenance overhead.
**Decision:** Maestro for mobile E2E tests. Test specs in `e2e/maestro/`.
**Consequences:** YAML-based test definitions. Runs against development builds. Tests critical flows: login, dashboard navigation, alert acknowledgment, approval workflow. CI integration via `e2e.yml` workflow.

---

## 16. Milestone Plan M1–M10

### M1: Foundation (Weeks 1-2) — COMPLETED

| Deliverable | Status |
|------------|--------|
| Repository initialization (both repos) | Done |
| pnpm + Turbo monorepo scaffold | Done |
| Package structure (@bac/*, @bac-mobile/*) | Done |
| Base TypeScript configuration | Done |
| ESLint + Prettier configuration | Done |
| CI workflows (PR, push) | Done |
| ARCHITECTURE.md baseline | Done |

### M2: Auth + Session (Weeks 3-4) — COMPLETED

| Deliverable | Status |
|------------|--------|
| @bac/auth package (OIDC, claims, cookies, guards, hooks, permissions) | Done |
| @bac-mobile/auth-mobile package (session, biometric, permissions) | Done |
| Login page (web) with Authentik scaffold | Done |
| Login screen (mobile) with OIDC + biometric | Done |
| Role taxonomy (9 roles, 21+ permissions) | Done |
| PermissionGuard / PermissionGate components | Done |
| Token refresh logic (web + mobile) | Done |

### M3: Design System + Tokens (Weeks 5-6) — COMPLETED

| Deliverable | Status |
|------------|--------|
| @bac/design-tokens (schema, transform, CSS variables, Tailwind) | Done |
| @bac/ui (27 components with Storybook) | Done |
| @bac-mobile/ui-mobile (Tamagui config, 14 components) | Done |
| Enterprise + consumer token sets | Done |
| Dark/light theme support (4 themes) | Done |
| ThemeToggle component (web) | Done |

### M4: API Clients + Data Layer (Weeks 7-8) — COMPLETED

| Deliverable | Status |
|------------|--------|
| @bac/api-clients (Connect-ES clients, HTTP primitives, hooks) | Done |
| 12 generated SDX service clients | Done |
| Platform GraphQL client + subscriptions | Done |
| Swagger client | Done |
| @bac-mobile/api-mobile-clients (TanStack Query hooks, mock data) | Done |
| AsyncStorage persistence (mobile) | Done |
| Mock-mode support (web + mobile) | Done |

### M5: Web App Routes (Weeks 9-10) — COMPLETED

| Deliverable | Status |
|------------|--------|
| software-factory-web: 19 routes (dashboard, workspaces, builds, compliance, etc.) | Done |
| platform-automation-web: 12 routes (regions, clusters, promises, gitops, etc.) | Done |
| docs-portal: 10 routes (getting-started, architecture, API reference, etc.) | Done |
| App shells with sidebar navigation | Done |
| API Explorer pages | Done |
| Admin pages | Done |

### M6: Mobile Screens (Weeks 11-12) — COMPLETED

| Deliverable | Status |
|------------|--------|
| 5 tab screens (dashboard, alerts, approvals, notifications, settings) | Done |
| 20+ detail routes (incidents, builds, clusters, workspaces, etc.) | Done |
| Auth flow screens (login, biometric, session confirmation) | Done |
| Settings screens (profile, workspace, notifications, about) | Done |
| Platform screens (observability, policy, regions-clusters) | Done |
| Software factory screens (pipeline-compliance, project-summary) | Done |

### M7: Cross-Repo Integration (Weeks 13-14) — COMPLETED

| Deliverable | Status |
|------------|--------|
| contracts/upstreams/ structure (both repos) | Done |
| Sync scripts (proto, openapi, design tokens) | Done |
| Integration CI workflows | Done |
| Compatibility manifest | Done |
| Contract validation scripts | Done |
| Design drift validation | Done |
| Cross-repo standards documentation | Done |

### M8: Observability + Config (Weeks 15-16) — COMPLETED

| Deliverable | Status |
|------------|--------|
| @bac/observability (logger, metrics, tracing, Sentry) | Done |
| @bac-mobile/observability (Sentry, logger, metrics) | Done |
| @bac/config (env, features, feature flags, regions) | Done |
| @bac-mobile/config (env, features, feature flags) | Done |
| OpenTelemetry integration (web) | Done |
| Feature flag provider (web + mobile) | Done |
| Multi-region config (web + mobile) | Done |

### M9: Production Hardening (Weeks 17-18) — COMPLETED

| Deliverable | Status |
|------------|--------|
| Dockerfile (multi-stage, standalone) | Done |
| EAS Build profiles (development, preview, staging, production) | Done |
| @bac/domain-contracts (shared Zod schemas) | Done |
| Semantic release configuration | Done |
| Bundle analysis workflow | Done |
| Accessibility audit workflow | Done |
| @bac/i18n framework | Done |
| @bac-mobile/i18n-mobile framework | Done |

### M10: Release Readiness (Weeks 19-20) — CURRENT

| Deliverable | Target |
|------------|--------|
| End-to-end Maestro test suite (mobile) | In Progress |
| Playwright test suite (web) | Planned |
| Performance benchmarks (LCP, FID, TTI) | Planned |
| Security audit (dependency scan, SAST) | Planned |
| Documentation review (all docs complete) | Planned |
| Dry-run release (staging deployment) | Planned |
| App Store / Play Store submission prep | Planned |
| Production rollout plan | Planned |

---

## 17. Handoff Package for Codex

### 17.1 Repository Tree Summary

```
stratogroup-ai-ecosystem/
│
├── AI-Software-Factory/           # Go backend — software generation
│   ├── api/openapi/               # REST contract (producer)
│   ├── api/proto/                 # gRPC contract (producer)
│   └── deploy/helm/               # Kubernetes deployment
│
├── AI-Platform-Automation/        # Go backend — platform control plane
│   ├── api/openapi/               # REST contract (producer)
│   ├── api/proto/                 # gRPC contract (producer)
│   └── platform/                  # Declarative IaC
│
├── Design-Factory_Stitch/         # Design exploration
│   ├── governance/                # Quality gates
│   ├── playbooks/                 # Operational guides
│   └── exports/                   # Concept inventory
│
├── Design-Factory_Figma/          # Design convergence
│   ├── packages/contracts/        # Token schema (producer)
│   ├── handoff/                   # Route maps + component specs (producer)
│   └── apps/                      # Figma workflow services
│
├── AI-Frontend-Experience/        # Web experience layer
│   ├── apps/                      # 3 Next.js apps (consumer)
│   ├── packages/                  # 10 @bac/* packages
│   ├── contracts/upstreams/       # Synced upstream contracts
│   └── Dockerfile                 # Container build
│
└── AI-Companion-Mobile/           # Mobile companion (consumer)
    ├── apps/                      # 1 Expo app
    ├── packages/                  # 7 @bac-mobile/* packages
    ├── contracts/upstreams/       # Synced upstream contracts
    └── e2e/maestro/               # E2E test specs
```

### 17.2 Implementation Backlog (Remaining)

| Priority | Item | Repo | Effort |
|----------|------|------|--------|
| P0 | Playwright E2E test suite | AI-Frontend-Experience | 3 days |
| P0 | Maestro E2E completion (all critical flows) | AI-Companion-Mobile | 2 days |
| P0 | Production Docker image validation | AI-Frontend-Experience | 1 day |
| P0 | EAS production build validation | AI-Companion-Mobile | 1 day |
| P1 | Performance benchmarks (Lighthouse CI) | AI-Frontend-Experience | 2 days |
| P1 | Security dependency audit | Both | 1 day |
| P1 | WebSocket reconnection hardening | AI-Frontend-Experience | 1 day |
| P1 | Push notification E2E with FCM/APNs | AI-Companion-Mobile | 2 days |
| P2 | Tablet-optimized layouts | AI-Companion-Mobile | 3 days |
| P2 | Dark mode toggle persistence | AI-Frontend-Experience | 0.5 day |
| P2 | CI build caching optimization | Both | 1 day |
| P2 | Chromatic visual regression | AI-Frontend-Experience | 2 days |
| P3 | i18n string extraction from all routes/screens | Both | 3 days |
| P3 | Feature flag admin dashboard | AI-Frontend-Experience | 2 days |
| P3 | Health check dashboard route | AI-Frontend-Experience | 1 day |

### 17.3 Acceptance Criteria

**Web (AI-Frontend-Experience):**

1. All 3 apps start without errors (`pnpm dev`)
2. `pnpm check` passes (lint + typecheck + test + build)
3. Docker build succeeds for all 3 apps
4. Login flow works with mock auth
5. All routes render with mock data
6. Storybook runs with all 27 components
7. Bundle analysis shows no regressions
8. Accessibility audit passes WCAG 2.1 AA
9. Contract validation passes against pinned upstreams
10. Design token validation passes

**Mobile (AI-Companion-Mobile):**

1. Expo dev server starts without errors (`pnpm dev`)
2. `pnpm check` passes (lint + typecheck + test + build)
3. EAS Build succeeds for preview profile
4. Login flow works with mock auth
5. All screens render with mock data
6. Tab navigation works correctly
7. Detail routes navigate with parameters
8. Biometric unlock flow works on supported devices
9. Contract validation passes against pinned upstreams
10. Design token validation passes

### 17.4 Files to Create First (For New Feature Work)

When adding a new product/domain to the ecosystem:

**Web:**
1. `apps/<new-product>-web/app/layout.tsx` — Root layout
2. `apps/<new-product>-web/app/page.tsx` — Landing page
3. `apps/<new-product>-web/app/login/page.tsx` — Auth entry
4. `apps/<new-product>-web/app/(app)/layout.tsx` — Authenticated shell
5. `apps/<new-product>-web/package.json` — App package config
6. `apps/<new-product>-web/next.config.ts` — Next.js config
7. `apps/<new-product>-web/tsconfig.json` — TypeScript config

**Mobile (new screen group):**
1. `apps/operator-mobile/app/<domain>/index.tsx` — List screen
2. `apps/operator-mobile/app/<domain>/[id].tsx` — Detail screen
3. Update `apps/operator-mobile/app/(tabs)/_layout.tsx` — Add tab if needed
4. Add query hooks in `packages/api-mobile-clients/src/index.tsx`
5. Add mock data in `packages/api-mobile-clients/src/mock.ts`

**Shared (if new upstream):**
1. `contracts/upstreams/<new-upstream>/api/openapi/` — OpenAPI spec
2. `contracts/upstreams/<new-upstream>/api/proto/` — Proto definitions (if gRPC)
3. Update `compatibility/manifest.json`
4. Add sync script in `scripts/`

---

## 18. Verification Checklist for Antigravity

### 18.1 Architecture Verification

| # | Check | Expected | Pass/Fail |
|---|-------|----------|-----------|
| A1 | Repo count matches design | 6 repositories | |
| A2 | Layer assignment correct | Design (2), Backend (2), Experience (2) | |
| A3 | No circular dependencies between layers | Design → Experience ← Backend | |
| A4 | Experience repos do not import backend source code | Contract artifacts only | |
| A5 | Backend repos do not import frontend source code | No TypeScript imports | |
| A6 | Design repos produce artifacts, not runtime services | No deployable containers | |
| A7 | Each repo has independent CI/CD | Separate GitHub Actions | |
| A8 | Each repo has independent package.json/go.mod | No shared lockfiles | |
| A9 | Contract ownership is unambiguous | One producer per artifact | |
| A10 | Package namespaces are non-overlapping | @bac/* vs @bac-mobile/* | |

### 18.2 Contract Verification

| # | Check | Expected | Pass/Fail |
|---|-------|----------|-----------|
| C1 | OpenAPI specs exist in both backend repos | YAML files in api/openapi/ | |
| C2 | Proto definitions exist in Software Factory | .proto files in api/proto/ | |
| C3 | Design tokens exist in Design-Factory_Figma | Zod schema in packages/contracts/ | |
| C4 | Consumer repos have contracts/upstreams/ | Synced upstream copies | |
| C5 | compatibility/manifest.json exists in both experience repos | Version pinning | |
| C6 | Sync scripts exist for all contract types | sync-proto, sync-openapi, sync-tokens | |
| C7 | Contract validation runs in CI | integration.yml workflow | |
| C8 | Breaking changes require major version bump | Documented in ADR-010 | |

### 18.3 Build Verification

| # | Check | Expected | Pass/Fail |
|---|-------|----------|-----------|
| B1 | `pnpm install` succeeds (web) | Zero errors | |
| B2 | `pnpm install` succeeds (mobile) | Zero errors | |
| B3 | `pnpm check` passes (web) | Lint + typecheck + test + build | |
| B4 | `pnpm check` passes (mobile) | Lint + typecheck + test + build | |
| B5 | Docker build succeeds for software-factory-web | Standalone output | |
| B6 | Docker build succeeds for platform-automation-web | Standalone output | |
| B7 | Docker build succeeds for docs-portal | Standalone output | |
| B8 | EAS build succeeds for preview profile | iOS + Android | |
| B9 | Storybook builds without errors | All stories render | |
| B10 | All 3 web apps start locally | Ports 3000, 3001, 3002 | |
| B11 | Mobile app starts locally | Port 8081 | |

### 18.4 Runtime Verification

| # | Check | Expected | Pass/Fail |
|---|-------|----------|-----------|
| R1 | Web login page renders | Authentik scaffold visible | |
| R2 | Mock auth flow works (web) | Operator session creates session | |
| R3 | All web routes render with mock data | No 500 errors | |
| R4 | Mobile login screen renders | OIDC + biometric options | |
| R5 | Mock auth flow works (mobile) | Local session creates session | |
| R6 | All mobile screens render with mock data | No red screens | |
| R7 | Tab navigation works (mobile) | 5 tabs navigate correctly | |
| R8 | Detail routes accept parameters | [id] routes resolve | |
| R9 | Theme toggle works (web) | Dark ↔ light | |
| R10 | Docs portal search works | Search index responds | |

### 18.5 Integration Verification

| # | Check | Expected | Pass/Fail |
|---|-------|----------|-----------|
| I1 | `pnpm contracts:generate` succeeds (web) | All syncs complete | |
| I2 | `pnpm contracts:generate` succeeds (mobile) | All syncs complete | |
| I3 | `pnpm design:validate` passes (web) | Token schema valid | |
| I4 | `pnpm design:validate` passes (mobile) | Token schema valid | |
| I5 | Generated Connect-ES clients compile | TypeScript passes | |
| I6 | Generated mobile client hooks compile | TypeScript passes | |
| I7 | Mock data matches API contract shapes | Zod validation passes | |
| I8 | Route map coverage matches app routes | ≥ 95% coverage | |

### 18.6 Governance Verification

| # | Check | Expected | Pass/Fail |
|---|-------|----------|-----------|
| G1 | CODEOWNERS exists in both experience repos | File present | |
| G2 | PR workflows require review approval | Branch protection active | |
| G3 | Conventional commits enforced | Commit lint configured | |
| G4 | ADRs documented | ≥ 15 ADRs | |
| G5 | ARCHITECTURE.md current | Matches implementation | |
| G6 | LOCAL_DEVELOPMENT.md accurate | Setup instructions work | |
| G7 | RELEASE.md documented | Release process complete | |
| G8 | Engineering doctrine stated | XP, TDD, DDD, AIDD | |

### 18.7 Security Verification

| # | Check | Expected | Pass/Fail |
|---|-------|----------|-----------|
| S1 | No secrets in source code | No API keys, tokens, passwords | |
| S2 | Auth tokens stored securely | HTTP-only cookies (web), Secure Store (mobile) | |
| S3 | OIDC PKCE flow implemented | Code challenge in auth flow | |
| S4 | Permission guards on protected routes | PermissionGuard/PermissionGate | |
| S5 | Docker runs as non-root | UID 1001 | |
| S6 | Dependencies have no critical CVEs | `pnpm audit` clean | |
| S7 | CORS configured correctly | Same-origin or allowlisted | |
| S8 | CSP headers present | Content-Security-Policy in next.config | |

---

## Appendix A: Package Dependency Graph

### Web (@bac/* packages)

```
@bac/ui
  └── @bac/auth
        └── @bac/domain-contracts

@bac/api-clients
  ├── @bac/config
  ├── @bac/domain-contracts
  └── @bac/observability

@bac/config (standalone - zod only)
@bac/design-tokens (standalone - zod only)
@bac/observability (standalone - @opentelemetry/api, @sentry/nextjs)
@bac/domain-contracts (standalone - zod only)
@bac/i18n (standalone)
@bac/testing (standalone)
@bac/eslint-config (standalone)
@bac/tsconfig (standalone)

Apps:
  software-factory-web → ui, auth, api-clients, config, design-tokens, observability
  platform-automation-web → ui, auth, api-clients, design-tokens
  docs-portal → ui, design-tokens
```

### Mobile (@bac-mobile/* packages)

```
@bac-mobile/ui-mobile (standalone - tamagui)
@bac-mobile/auth-mobile (standalone - expo-local-authentication, expo-secure-store, zod)
@bac-mobile/api-mobile-clients
  └── @bac-mobile/config
@bac-mobile/config (standalone - zod, async-storage)
@bac-mobile/observability (standalone - @sentry/react-native)
@bac-mobile/i18n-mobile (standalone - i18next, expo-localization)
@bac-mobile/testing (standalone)

App:
  operator-mobile → ui-mobile, auth-mobile, api-mobile-clients, config
```

---

## Appendix B: Naming Conventions

| Entity | Convention | Example |
|--------|-----------|---------|
| Repository | PascalCase with hyphens | `AI-Frontend-Experience` |
| Web package | `@bac/<name>` | `@bac/auth` |
| Mobile package | `@bac-mobile/<name>` | `@bac-mobile/auth-mobile` |
| Web app | `<product>-web` | `software-factory-web` |
| Mobile app | `operator-mobile` | Single app, multi-product |
| Route segment | kebab-case | `/software-factory/release-manager` |
| Component file | PascalCase.tsx | `CommandPalette.tsx` |
| Hook file | camelCase.ts | `usePermission.ts` |
| Contract artifact | kebab-case | `software-factory-openapi` |
| Release tag | `contracts/<artifact>/v<semver>` | `contracts/software-factory-openapi/v1.2.0` |
| Design handoff tag | `handoff/<artifact>/v<semver>` | `handoff/figma-design-tokens/v1.0.0` |
| Event name | `bac.<domain>.<resource>.<action>` | `bac.sdx.build.completed` |
| Environment variable (web) | `NEXT_PUBLIC_BAC_*` | `NEXT_PUBLIC_BAC_API_BASE_URL` |
| Environment variable (mobile) | `EXPO_PUBLIC_BAC_*` | `EXPO_PUBLIC_BAC_API_BASE_URL` |
| Docker image | `ghcr.io/stratogroup/bac-<app>` | `ghcr.io/stratogroup/bac-software-factory-web` |

---

## Appendix C: Technology Matrix

| Concern | Web (AI-Frontend-Experience) | Mobile (AI-Companion-Mobile) | Backend (Software Factory) | Backend (Platform) | Design (Stitch) | Design (Figma) |
|---------|------------------------------|------------------------------|---------------------------|-------------------|----------------|----------------|
| **Language** | TypeScript | TypeScript | Go | Go + HCL | Python + Markdown | TypeScript |
| **Framework** | Next.js 15 | Expo 52 / RN 0.76 | stdlib + Connect | stdlib + Crossplane | Prompt pipelines | Fastify + Temporal |
| **UI** | Tailwind + @bac/ui | Tamagui + @bac-mobile/ui | N/A | N/A | N/A | Figma API |
| **State** | TanStack Query + Zustand | TanStack Query + Zustand | Domain events | Domain events | Git | Git |
| **Auth** | Authentik OIDC (web) | Authentik OIDC (native) | Authentik (server) | Authentik (server) | N/A | N/A |
| **Data** | Consume via API | Consume via API | Hasura + PostgreSQL | Hasura + PostgreSQL | Filesystem | Figma + PostgreSQL |
| **Testing** | Vitest + Playwright | Jest + Maestro | Go test + k6 | Go test + conformance | Manual + checklists | Vitest + workflow tests |
| **CI** | GitHub Actions + Turbo | GitHub Actions + EAS | GitHub Actions + Make | GitHub Actions + Make | GitHub Actions | GitHub Actions |
| **Deploy** | Docker → K8s (Fleet) | EAS Build → App Store | Helm → K8s (Fleet) | Helm → K8s (Fleet) | GitHub Releases | GitHub Releases |
| **Observability** | OTel + Sentry | Sentry + custom metrics | VictoriaStack + OTel | VictoriaStack + OTel | N/A | N/A |

---

*End of Master Ecosystem Architecture Package*
*Version 1.0.0 — 2026-03-23*
*StratoGroup — BAC Platform Architecture*
