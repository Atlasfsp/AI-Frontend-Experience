# BAC Ecosystem — Compatibility Matrix Model

**Version:** 1.0.0
**Date:** 2026-03-23
**Status:** AUTHORITATIVE BASELINE

---

## Compatibility Manifest Schema

Every consumer repo maintains `compatibility/manifest.json` with this exact schema:

```json
{
  "schemaVersion": "1.0.0",
  "repo": "<consumer-repo-name>",
  "repoVersion": "<consumer-semver>",
  "compatibleUpstreams": [
    {
      "repo": "<producer-repo-name>",
      "artifactId": "<contract-artifact-id>",
      "supportedRange": "<semver-range>",
      "pinnedVersion": "<exact-version-last-validated>",
      "lastValidatedAt": "<ISO-8601>"
    }
  ],
  "validatedAt": "<ISO-8601>"
}
```

---

## Current Compatibility State

### AI-Frontend-Experience (v0.1.0)

| Upstream Repo | Artifact ID | Supported Range | Status |
|--------------|-------------|----------------|--------|
| AI-Software-Factory | software-factory-openapi | ^1.0.0 | Active |
| AI-Software-Factory | software-factory-proto | ^1.0.0 | Active |
| AI-Software-Factory | software-factory-connect-typescript | ^1.0.0 | Active |
| AI-Platform-Automation | platform-automation-openapi | ^1.0.0 | Active |
| AI-Platform-Automation | platform-automation-proto | ^1.0.0 | Active |
| Design-Factory_Figma | figma-design-tokens | ^1.0.0 | Active |
| Design-Factory_Figma | figma-web-route-map | ^1.0.0 | Active |
| Design-Factory_Figma | figma-component-specs-web | ^1.0.0 | Active |
| Design-Factory_Figma | figma-state-maps | ^1.0.0 | Active |
| Design-Factory_Stitch | stitch-screen-maps | ^1.0.0 | Active |

### AI-Companion-Mobile (v0.1.0)

| Upstream Repo | Artifact ID | Supported Range | Status |
|--------------|-------------|----------------|--------|
| AI-Software-Factory | software-factory-openapi | ^1.0.0 | Active |
| AI-Platform-Automation | platform-automation-openapi | ^1.0.0 | Active |
| Design-Factory_Figma | figma-design-tokens | ^1.0.0 | Active |
| Design-Factory_Figma | figma-mobile-route-map | ^1.0.0 | Active |
| Design-Factory_Figma | figma-component-specs-mobile | ^1.0.0 | Active |
| Design-Factory_Figma | figma-state-maps | ^1.0.0 | Active |
| Design-Factory_Stitch | stitch-concept-inventory | ^1.0.0 | Active |

---

## Breakage Detection Rules

### Automated Detection (CI)

| Scenario | Detection Method | CI Action |
|----------|-----------------|-----------|
| Minor/patch upstream release | `integration.yml` detects newer version within `supportedRange` | Auto-creates PR with updated contracts |
| Major upstream release | `integration.yml` detects version outside `supportedRange` | Creates GitHub Issue — requires manual migration |
| Design token schema break | `validate-design-drift.mjs` fails token-shape validation | Fails PR |
| Route/component/state coverage drop | Coverage check < 95% | Fails PR |
| Generated client type mismatch | `validate-contract-drift.mjs` detects diff | Fails PR |
| API endpoint removed | Generated client method has no matching spec path | Fails typecheck |

### Manual Detection (Antigravity)

| Check | Method |
|-------|--------|
| Layer boundary violation | Review imports — experience must not import backend source |
| Contract ownership violation | Review producer — only designated repo may publish an artifact |
| Package namespace collision | Verify @bac/* and @bac-mobile/* remain non-overlapping |

---

## Release Coordination

### Independence Rule
Web and mobile release independently. No cross-repo release lock. Compatibility is validated post-release via consumer CI.

### Coordination Sequence
```
Phase 1 (parallel):
  Backend repos tag releases → publish OpenAPI + Proto contracts
  Design repos tag releases → publish tokens, route maps, specs

Phase 2 (after Phase 1):
  Experience repos:
    1. pnpm contracts:generate (sync + regenerate)
    2. pnpm contracts:validate (verify no drift)
    3. pnpm check (full quality gate)
    4. Tag release
```

### Post-Release Validation
After any upstream release, consumer `integration.yml` runs automatically on the next PR or push to main. If validation fails, the consumer team is notified via CI failure.

---

## Compatibility Report Script

Both experience repos include `scripts/integration/report-compatibility.mjs` which outputs a JSON report:

```json
{
  "repo": "ai-frontend-experience",
  "version": "0.1.0",
  "upstreams": [
    {
      "repo": "ai-software-factory",
      "artifact": "software-factory-openapi",
      "pinnedVersion": "1.0.0",
      "actualVersion": "1.0.0",
      "selectedReleaseTag": "ai-software-factory/v1.0.0",
      "compatible": true,
      "driftDetected": false
    }
  ],
  "overallStatus": "COMPATIBLE",
  "generatedAt": "2026-03-23T00:00:00Z"
}
```
