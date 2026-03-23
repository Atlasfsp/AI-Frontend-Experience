# BAC Ecosystem — Contract Ownership Model

**Version:** 1.0.0
**Date:** 2026-03-23
**Status:** AUTHORITATIVE BASELINE

---

## Contract Artifact Ownership Matrix

| Artifact ID | Format | Producing Repo | Version Tag Pattern | Consumers |
|-------------|--------|---------------|-------------------|-----------|
| `software-factory-openapi` | OpenAPI 3.1 YAML/JSON | AI-Software-Factory | `contracts/software-factory-openapi/v<semver>` | AI-Frontend-Experience, AI-Companion-Mobile |
| `software-factory-proto` | Protobuf (buf-managed) | AI-Software-Factory | `contracts/software-factory-proto/v<semver>` | AI-Frontend-Experience |
| `software-factory-connect-typescript` | Connect-ES TypeScript | AI-Software-Factory | `contracts/software-factory-connect-typescript/v<semver>` | AI-Frontend-Experience |
| `platform-automation-openapi` | OpenAPI 3.1 YAML/JSON | AI-Platform-Automation | `contracts/platform-automation-openapi/v<semver>` | AI-Frontend-Experience, AI-Companion-Mobile |
| `platform-automation-proto` | Protobuf | AI-Platform-Automation | `contracts/platform-automation-proto/v<semver>` | AI-Frontend-Experience |
| `figma-design-tokens` | Zod-validated JSON | Design-Factory_Figma | `handoff/figma-design-tokens/v<semver>` | AI-Frontend-Experience, AI-Companion-Mobile |
| `figma-web-route-map` | JSON manifest | Design-Factory_Figma | `handoff/figma-web-route-map/v<semver>` | AI-Frontend-Experience |
| `figma-mobile-route-map` | JSON manifest | Design-Factory_Figma | `handoff/figma-mobile-route-map/v<semver>` | AI-Companion-Mobile |
| `figma-component-specs-web` | JSON specs | Design-Factory_Figma | `handoff/figma-component-specs-web/v<semver>` | AI-Frontend-Experience |
| `figma-component-specs-mobile` | JSON specs | Design-Factory_Figma | `handoff/figma-component-specs-mobile/v<semver>` | AI-Companion-Mobile |
| `figma-state-maps` | JSON specs | Design-Factory_Figma | `handoff/figma-state-maps/v<semver>` | AI-Frontend-Experience, AI-Companion-Mobile |
| `stitch-concept-inventory` | Markdown + JSON | Design-Factory_Stitch | `handoff/stitch-concept-inventory/v<semver>` | Design-Factory_Figma |
| `stitch-screen-maps` | JSON | Design-Factory_Stitch | `handoff/stitch-screen-maps/v<semver>` | Design-Factory_Figma, AI-Frontend-Experience |
| `stitch-exploratory-prompts` | JSON | Design-Factory_Stitch | `handoff/stitch-exploratory-prompts/v<semver>` | Design-Factory_Figma |

---

## Contract Flow Diagram

```
PRODUCERS                              CONSUMERS
─────────                              ─────────

AI-Software-Factory                    AI-Frontend-Experience
  api/openapi/openapi.yaml      ──>      contracts/upstreams/ai-software-factory/api/openapi/
  api/proto/sdx/v1/*.proto      ──>      contracts/upstreams/ai-software-factory/api/proto/
                                           ▼ (codegen)
                                         packages/api-clients/src/generated/
                                           - software-factory-client.ts (19 methods)
                                           - sdx/v1/*_connect.ts (11 stubs)

AI-Platform-Automation                 AI-Frontend-Experience
  api/openapi/*.yaml            ──>      contracts/upstreams/ai-platform-automation/api/openapi/
                                           ▼ (codegen)
                                         packages/api-clients/src/generated/
                                           - platform-automation-client.ts (8 methods)

AI-Software-Factory                    AI-Companion-Mobile
  api/openapi/openapi.yaml      ──>      contracts/upstreams/ai-software-factory/api/openapi/
                                           ▼ (codegen)
                                         packages/api-mobile-clients/src/generated/
                                           - software-factory-client.ts (19 methods)

AI-Platform-Automation                 AI-Companion-Mobile
  api/openapi/*.yaml            ──>      contracts/upstreams/ai-platform-automation/api/openapi/
                                           ▼ (codegen)
                                         packages/api-mobile-clients/src/generated/
                                           - platform-client.ts (8 methods)

Design-Factory_Figma                   AI-Frontend-Experience
  design-system/tokens/*.json   ──>      contracts/upstreams/design-factory-figma/design-system/tokens/
  handoff/route-maps/*.json     ──>      contracts/upstreams/design-factory-figma/handoff/route-maps/
  handoff/component-specs/*.json──>      contracts/upstreams/design-factory-figma/handoff/component-specs/
                                           ▼ (transform)
                                         packages/design-tokens/ → CSS vars + Tailwind theme

Design-Factory_Figma                   AI-Companion-Mobile
  design-system/tokens/*.json   ──>      contracts/upstreams/design-factory-figma/design-system/tokens/
  handoff/route-maps/*.json     ──>      contracts/upstreams/design-factory-figma/handoff/route-maps/
                                           ▼ (transform)
                                         packages/ui-mobile/src/tamagui.ts → Tamagui themes

Design-Factory_Stitch                  Design-Factory_Figma
  exports/concept-inventory/    ──>      (consumed via handoff pack)
  handoffs/exploratory-prompts/ ──>      (imported into prompts/)
```

---

## Ownership Rules (Enforceable)

### Rule 1: Producers Own Schemas
A consumer NEVER modifies an upstream contract artifact. If a consumer needs a contract change, they file an issue in the producer repo.

### Rule 2: Semver Governs Breaking Changes
- **Patch** (0.0.x): Bug fix in spec (no schema change)
- **Minor** (0.x.0): Additive change (new endpoint, new optional field)
- **Major** (x.0.0): Breaking change (removed endpoint, changed required field, renamed type)

### Rule 3: Consumers Pin Ranges
Consumer `compatibility/manifest.json` files declare `supportedRange` using semver ranges (e.g., `^1.0.0`). CI validates against pinned ranges.

### Rule 4: CI Validates on Every PR
The `integration.yml` workflow in each consumer repo:
1. Syncs latest upstream artifacts
2. Regenerates client bindings
3. Diffs generated output against committed files
4. Fails PR if drift detected

### Rule 5: Breaking Changes Create Issues, Not PRs
When a producer publishes a major version bump, consumer `integration.yml` creates a GitHub Issue (not an auto-PR). The consumer team decides when and how to migrate.

---

## Where Artifacts Live (Physical Locations)

### Producers

| Repo | Contract Location |
|------|------------------|
| AI-Software-Factory | `neuroforge-sdx/api/openapi/` and `neuroforge-sdx/api/proto/` |
| AI-Platform-Automation | `api/openapi/` and `api/proto/` |
| Design-Factory_Figma | `design-system/tokens/`, `handoff/route-maps/`, `handoff/component-specs/`, `handoff/state-maps/` |
| Design-Factory_Stitch | `exports/concept-inventory/`, `handoffs/exploratory-prompts/` |

### Consumers

| Repo | Synced Contract Location | Generated Client Location |
|------|------------------------|--------------------------|
| AI-Frontend-Experience | `contracts/upstreams/<producer>/` | `packages/api-clients/src/generated/` |
| AI-Companion-Mobile | `contracts/upstreams/<producer>/` | `packages/api-mobile-clients/src/generated/` |

### Manifests

| Repo | Manifest Location |
|------|------------------|
| AI-Frontend-Experience | `compatibility/manifest.json` |
| AI-Companion-Mobile | `compatibility/manifest.json` |
| Design-Factory_Figma | `compatibility/manifest.json` |
| Design-Factory_Stitch | `compatibility/manifest.json` |
