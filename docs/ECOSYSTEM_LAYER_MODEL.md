# BAC Ecosystem — 3-Layer Strategic Model

**Version:** 1.0.0
**Date:** 2026-03-23
**Status:** IMMUTABLE BASELINE — Must be read before any Codex/Antigravity work

---

## Layer Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          DESIGN LAYER                                    │
│                                                                          │
│   Design-Factory_Stitch              Design-Factory_Figma                │
│   (Explore many directions)    ───>  (Converge to one direction)         │
│                                                                          │
│   OUTPUTS:                           OUTPUTS:                            │
│   - concept inventories              - design tokens (Zod JSON)          │
│   - screen maps                      - route maps (JSON)                 │
│   - design briefs                    - component specs (JSON)            │
│   - handoff packs                    - state maps (JSON)                 │
│                                      - handoff exports                   │
└───────────────────────────────────────┬──────────────────────────────────┘
                                        │
                        design tokens, route maps, component specs, state maps
                                        │
┌───────────────────────────────────────▼──────────────────────────────────┐
│                        EXPERIENCE LAYER                                  │
│                                                                          │
│   AI-Frontend-Experience                  AI-Companion-Mobile            │
│   (Web: 3 Next.js apps)                   (Mobile: 1 Expo app)          │
│                                                                          │
│   - software-factory-web (:3000)          - operator-mobile              │
│   - platform-automation-web (:3001)       - 35+ screens                  │
│   - docs-portal (:3002)                   - alerts/approvals/incidents   │
│   - 11 @bac/* packages                    - 7 @bac-mobile/* packages    │
│   - 50+ routes                            - push notifications          │
│                                                                          │
│   CONSUMES: OpenAPI, Proto, design tokens, route maps, component specs   │
│   PRODUCES: Docker images (web), EAS builds (mobile)                     │
└───────────────────────────────────────▲──────────────────────────────────┘
                                        │
                        HTTP / gRPC / GraphQL / WebSocket (runtime)
                        OpenAPI + Proto specs (build-time contracts)
                                        │
┌───────────────────────────────────────┴──────────────────────────────────┐
│                     BACKEND / CONTROL LAYER                              │
│                                                                          │
│   AI-Software-Factory                     AI-Platform-Automation         │
│   (NeuroForge SDX)                        (BAC Control Plane)            │
│                                                                          │
│   - Go api-server, worker, cli            - Go api-server, worker, cli  │
│   - 13 Proto services                     - Control plane RPCs          │
│   - OpenAPI 3.1 REST surface              - OpenAPI 3.1 REST surface    │
│   - PRD → code generation                 - Tenancy, provisioning       │
│   - Compliance, quality gates             - GitOps, promises, policy    │
│   - Agent orchestration                   - Observability, incidents    │
│                                                                          │
│   PRODUCES: OpenAPI specs, Proto definitions, NATS events, Docker images │
│   DATA: Hasura + PostgreSQL, Meilisearch, Qdrant                        │
│   MESSAGING: NATS JetStream (regional), Redpanda (inter-regional)       │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Layer Interaction Rules

| Source → Target | Mechanism | Direction |
|----------------|-----------|-----------|
| Design → Experience | Versioned design artifacts (tokens, route maps, specs) via GitHub Release | Downstream publish → consume |
| Backend → Experience | Versioned API contracts (OpenAPI, Proto) via GitHub Release | Downstream publish → consume |
| Experience → Backend | HTTP / gRPC / GraphQL / WebSocket calls | Runtime request → response |
| Stitch → Figma | Concept handoff packs (inventories, screen maps) | Downstream handoff → refine |
| Software Factory ↔ Platform | NATS JetStream events, Redpanda inter-region | Runtime event bus |
| Experience ↛ Experience | No runtime coupling between web and mobile | None |
| Experience ↛ Design | No reverse flow from engineering to design repos | None |
| Backend ↛ Experience | Backend never imports frontend/mobile source | None |

---

## Invariant Constraints (Enforceable)

1. **Design repos never call backend APIs.** They produce artifacts consumed by experience repos.
2. **Experience repos never write to backend databases.** All mutations flow through backend API contracts.
3. **Backend repos never import frontend/mobile code.** Contract artifacts are the only coupling surface.
4. **Stitch never produces production-intent designs.** Only explorations. Figma owns convergence.
5. **Mobile never replicates full web functionality.** It surfaces operational quick-actions only.
6. **Web never bundles mobile-specific code.** Shared types exist at contract level, not import level.
7. **No repo may assume responsibilities described in another repo's catalog entry.**

---

## Why This Layering Is Strategically Correct

| Concern | Separation Achieved |
|---------|-------------------|
| **Velocity** | Design iterates hourly, experience daily, backend weekly. Different cadences need different repos. |
| **Skill** | Designers use Stitch/Figma, frontend engineers use TypeScript/React, backend engineers use Go. No team needs another team's toolchain. |
| **Blast radius** | Broken design explorations affect nothing. Broken UI affects users. Broken backend affects the platform. |
| **Deployment** | Design publishes artifacts. Web deploys containers. Mobile deploys to app stores. Backend deploys to Kubernetes. |
| **Security** | Backend repos hold sensitive infrastructure code. Frontend repos hold UI code. Design repos hold no credentials. |

---

## Adding a New Product

When a new BAC product is introduced (e.g., "AI-Compliance-Engine"):

1. **Backend:** Create new repo following Go hexagonal template. Publish OpenAPI + Proto contracts.
2. **Design:** Add product directories under both Stitch (`prompts/`) and Figma (`prompts/`, `handoff/`).
3. **Web:** Add `apps/<product>-web/` to AI-Frontend-Experience monorepo.
4. **Mobile:** Add screen routes under `apps/operator-mobile/app/<product>/` in AI-Companion-Mobile.
5. **Contracts:** Add `contracts/upstreams/<product>/` to both experience repos.
6. **No structural changes needed.** The layer model scales to N products.
