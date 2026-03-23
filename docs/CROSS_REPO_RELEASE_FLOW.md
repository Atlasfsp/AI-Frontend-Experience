# BAC Ecosystem — Cross-Repo Release Flow

**Version:** 1.0.0
**Date:** 2026-03-23
**Status:** AUTHORITATIVE BASELINE

---

## Release Sequence

Releases must flow in this order to preserve contract compatibility:

```
PHASE 1: Producers Release (parallel)
──────────────────────────────────────
  AI-Software-Factory ──tag v1.x.x──> Publishes:
    - contracts/software-factory-openapi/v1.x.x (GitHub Release)
    - contracts/software-factory-proto/v1.x.x
    - contracts/software-factory-connect-typescript/v1.x.x
    - Docker image: ghcr.io/stratogroup/sdx-api:v1.x.x

  AI-Platform-Automation ──tag v1.x.x──> Publishes:
    - contracts/platform-automation-openapi/v1.x.x
    - contracts/platform-automation-proto/v1.x.x
    - Docker image: ghcr.io/stratogroup/bac-platform:v1.x.x

  Design-Factory_Figma ──tag v1.x.x──> Publishes:
    - handoff/figma-design-tokens/v1.x.x
    - handoff/figma-web-route-map/v1.x.x
    - handoff/figma-mobile-route-map/v1.x.x
    - handoff/figma-component-specs-web/v1.x.x
    - handoff/figma-component-specs-mobile/v1.x.x
    - handoff/figma-state-maps/v1.x.x

  Design-Factory_Stitch ──tag v1.x.x──> Publishes:
    - handoff/stitch-concept-inventory/v1.x.x
    - handoff/stitch-screen-maps/v1.x.x
    - handoff/stitch-exploratory-prompts/v1.x.x


PHASE 2: Consumers Sync and Release (after Phase 1)
────────────────────────────────────────────────────
  AI-Frontend-Experience:
    1. scripts/integration/sync-upstreams.mjs pulls new contract artifacts
    2. scripts/integration/generate-client-bindings.mjs regenerates typed clients
    3. scripts/integration/validate-contract-drift.mjs verifies no drift
    4. scripts/integration/validate-design-drift.mjs verifies token schema
    5. pnpm check (lint + typecheck + test + build)
    6. semantic-release creates tag v1.x.x
    7. Docker images built for all 3 apps:
       - ghcr.io/stratogroup/bac-software-factory-web:v1.x.x
       - ghcr.io/stratogroup/bac-platform-automation-web:v1.x.x
       - ghcr.io/stratogroup/bac-docs-portal:v1.x.x
    8. Deploy to staging → smoke test → promote to production

  AI-Companion-Mobile:
    1. scripts/integration/sync-upstreams.mjs pulls new contract artifacts
    2. scripts/integration/generate-client-bindings.mjs regenerates typed clients
    3. Validate contracts and design tokens
    4. pnpm check (lint + typecheck + test + build)
    5. semantic-release creates tag v1.x.x
    6. EAS Build (staging profile) → TestFlight / Firebase App Distribution
    7. Smoke test staging
    8. EAS Build (production profile) → App Store / Google Play submission
```

---

## Semantic Versioning Rules

| Change Type | Version Bump | Examples |
|------------|-------------|---------|
| Breaking API change | **Major** | Remove endpoint, change request schema, rename type |
| New feature | **Minor** | Add endpoint, add optional field, new response type |
| Bug fix | **Patch** | Fix response format, fix validation rule |
| Design token addition | **Minor** | New color, new spacing value |
| Design token rename/removal | **Major** | Rename color key, remove spacing value |
| Route addition | **Minor** | New page route |
| Route removal | **Major** | Remove page route |

---

## Rollback Protocol

| Layer | Mechanism | Time to Rollback |
|-------|----------|------------------|
| Web (container) | Redeploy previous Docker image via Fleet GitOps | < 5 minutes |
| Mobile (OTA) | Revert EAS Update branch | < 2 minutes |
| Mobile (native) | Resubmit previous build to stores | 24-48 hours (store review) |
| Backend | Helm rollback via Fleet | < 5 minutes |
| Design tokens | Revert to previous token release tag, redeploy experience apps | < 10 minutes |

---

## Breaking Change Protocol

When a producer needs to make a breaking change:

1. **Producer** creates ADR documenting the break and migration path
2. **Producer** bumps major version in spec
3. **Producer** tags release with new major version
4. **Consumer CI** detects major version outside `supportedRange`
5. **Consumer CI** creates GitHub Issue: "Breaking upstream change: <artifact> v<major>"
6. **Consumer team** plans migration sprint
7. **Consumer** updates code, updates `supportedRange` in `compatibility/manifest.json`
8. **Consumer** releases new version with updated compatibility

---

## Release Governance

| Action | Authority |
|--------|----------|
| Tag backend release | Backend Tech Lead + Architecture review |
| Tag design release | Design Engineering Lead |
| Tag web release | Frontend Tech Lead |
| Tag mobile release | Mobile Tech Lead |
| Approve breaking change | Architecture Lead + all affected team leads |
| Emergency rollback | On-call SRE (any team) |

---

## Commit Convention (All 6 Repos)

```
<type>(<scope>): <description>

Types: feat, fix, perf, refactor, docs, chore, test, ci, build
Breaking changes: add BREAKING CHANGE: in commit body
```

Semantic-release reads conventional commits to determine version bumps automatically.
