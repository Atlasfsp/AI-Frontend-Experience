# BAC Ecosystem — Final Architecture Review

**Version:** 2.0.0
**Date:** 2026-03-23
**Reviewer:** Chief Architecture Strategist, StratoGroup
**Status:** APPROVED WITH 6 CONDITIONS
**Scope:** 6-repository ecosystem, all 3 layers

---

## 1. Architecture Compliance Verdict

### Overall: COMPLIANT — 3-Layer Model Preserved

| Layer | Repos | Status | Evidence |
|-------|-------|--------|----------|
| **Design** | Design-Factory_Stitch, Design-Factory_Figma | ✅ COMPLIANT | Stitch produces explorations; Figma converges to production-intent tokens, route maps, component specs. No runtime services in design repos. |
| **Backend/Control** | AI-Software-Factory, AI-Platform-Automation | ✅ COMPLIANT | Go services with OpenAPI 3.1 + Protobuf contracts. Independent release cadences. Connected via NATS JetStream. Neither repo imports frontend code. |
| **Experience** | AI-Frontend-Experience, AI-Companion-Mobile | ✅ COMPLIANT | No cross-import between web and mobile. Both consume backend contracts and design tokens downstream. Neither modifies upstream artifacts. |

### Boundary Verification

| Rule | Status |
|------|--------|
| Experience repos do not import backend source code | ✅ Contract artifacts only via contracts/upstreams/ |
| Backend repos do not import frontend code | ✅ Verified |
| Design repos produce artifacts, not runtime services | ✅ No Dockerfiles, no deployable containers |
| Web and mobile do not cross-import | ✅ Separate package namespaces: @bac/* vs @bac-mobile/* |
| Contract ownership is unambiguous | ✅ Each artifact has exactly one producer |
| HOTL is the default governance mode | ✅ governance/manifest.json confirms in both repos |
| Swagger/OpenAPI compliance is first-class | ✅ swaggerExplorer flag enabled, API Explorer routes present |
| Design-to-code traceability preserved | ✅ Token sync, route map sync, component spec sync, design drift validation |

### Independent Deployability Verification

| Repo | Build System | Deploy Target | Independent? |
|------|-------------|---------------|-------------|
| AI-Software-Factory | Go + Makefile | Helm → K8s (Fleet) | ✅ |
| AI-Platform-Automation | Go + Makefile | Helm → K8s (Fleet) | ✅ |
| Design-Factory_Stitch | Markdown + Python | GitHub Releases | ✅ |
| Design-Factory_Figma | TypeScript + Fastify | GitHub Releases | ✅ |
| AI-Frontend-Experience | pnpm + Turbo + Docker | Containers → K8s | ✅ |
| AI-Companion-Mobile | pnpm + Turbo + EAS | App Store / Play Store | ✅ |

---

## 2. Must-Fix Before Release (6 Items)

### MF-01: HOTL/HITL/FULL_AUTONOMY Feature Flag Missing in Config Package

**Severity:** P0 — Governance gap
**Repo:** Both experience repos
**Issue:** The governance mode is tracked in `governance/manifest.json` and validated by `validate-governance-mode.mjs`, but there is no runtime feature flag in `packages/config/src/features.ts` that allows application code to check the current governance mode. The manifest is a CI artifact, not a runtime value.
**Fix:** Add `governanceMode: 'HOTL' | 'HITL' | 'FULL_AUTONOMY'` to both feature flag interfaces. Default: `'HOTL'`. Env vars: `NEXT_PUBLIC_BAC_GOVERNANCE_MODE` (web), `EXPO_PUBLIC_BAC_GOVERNANCE_MODE` (mobile). Wire into approval and incident screens to show confirmation dialogs in HOTL mode, auto-execute in FULL_AUTONOMY mode.

### MF-02: Approval Screen Does Not Enforce HOTL Confirmation Gate

**Severity:** P0 — Governance gap
**Repo:** Both experience repos
**Issue:** The approval workflow (`useApproveDecision` mutation) executes immediately without a human confirmation step. In HOTL mode, every approval action must present a confirmation dialog showing what is being approved, the risk level, and require explicit "Confirm" tap. In HITL mode, it should additionally require a second reviewer. In FULL_AUTONOMY mode, it can auto-execute.
**Fix:** Create `packages/ui/src/components/governance-gate.tsx` (web) and equivalent mobile component that wraps destructive actions. The gate reads governance mode from config and enforces the appropriate confirmation level.

### MF-03: Incident Acknowledge Has No HOTL Gate

**Severity:** P0 — Governance gap
**Repo:** Both experience repos
**Issue:** Same as MF-02 but for incident acknowledgment. `useAcknowledgeIncident` and `useAcknowledgeAlert` execute without governance-mode-aware confirmation.
**Fix:** Wrap incident acknowledge and alert acknowledge actions in the same governance gate component.

### MF-04: AGENTS.md Files Reference Outdated P0 Items

**Severity:** P1 — Documentation drift
**Repo:** Both experience repos
**Issue:** AGENTS.md files in both repos still reference the original P0 must-fixes (stub codegen, no health endpoint, etc.) which have all been resolved. This creates confusion for Codex and Antigravity about what work remains.
**Fix:** Update AGENTS.md in both repos to reflect current state. Remove resolved items. Add current must-fix items (MF-01 through MF-06).

### MF-05: FINAL_ARCHITECTURE_REVIEW.md Is Stale

**Severity:** P1 — Documentation drift
**Repo:** Both experience repos
**Issue:** `docs/FINAL_ARCHITECTURE_REVIEW.md` still says "API Client Codegen is stub" and "No health check endpoint in Platform Web" — both resolved. Codex will re-implement work that is already done.
**Fix:** This document (FINAL_ECOSYSTEM_REVIEW.md) supersedes it. Mark the old file as superseded with a redirect header.

### MF-06: Upstream Monitor Workflow Uses GitHub Token Without Secret Validation

**Severity:** P1 — CI robustness
**Repo:** Both experience repos
**Issue:** `.github/workflows/upstream-monitor.yml` calls GitHub API to check upstream releases but does not validate that `GITHUB_TOKEN` has sufficient scope. If the token lacks `contents:read` on upstream repos, the job silently returns empty results instead of failing.
**Fix:** Add a preflight check step that validates token scopes before running the monitor.

---

## 3. Should-Fix After Release (10 Items)

| # | Item | Repo | Priority |
|---|------|------|----------|
| SF-01 | Add HOTL audit trail to all governance-gated actions (log who approved, when, what mode) | Both | P2 |
| SF-02 | Create `@bac/governance` shared package extracting GovernanceGate, mode check, audit logger | Web | P2 |
| SF-03 | Create `@bac-mobile/governance` equivalent for mobile | Mobile | P2 |
| SF-04 | Add governance mode indicator to app shell header (shows HOTL/HITL/FULL_AUTONOMY badge) | Both | P2 |
| SF-05 | Wire Playwright E2E tests to validate HOTL confirmation gates | Web | P2 |
| SF-06 | Wire Maestro E2E flow for HOTL approval confirmation | Mobile | P2 |
| SF-07 | Add `governance:audit` script that produces a report of all governance-gated actions taken | Both | P3 |
| SF-08 | Add contract-level typing for governance mode in `@bac/domain-contracts` | Web | P3 |
| SF-09 | Consolidate 22 mobile docs into categorized subdirectories | Mobile | P3 |
| SF-10 | Add dark mode persistence (currently resets on reload) | Web | P3 |

---

## 4. Final Release Coordination Model

### Release Sequence (Mandatory Order)

```
Phase 1: Backend contracts published
  AI-Software-Factory tags: contracts/software-factory-openapi/v1.x.x
  AI-Platform-Automation tags: contracts/platform-automation-openapi/v1.x.x

Phase 2: Design handoff artifacts published
  Design-Factory_Figma tags: handoff/figma-design-tokens/v1.x.x
                              handoff/figma-web-route-map/v1.x.x
                              handoff/figma-mobile-route-map/v1.x.x
                              handoff/figma-component-specs-web/v1.x.x
                              handoff/figma-component-specs-mobile/v1.x.x

Phase 3: Experience repos sync and validate
  AI-Frontend-Experience:
    1. pnpm contracts:generate (sync upstream artifacts)
    2. pnpm contracts:validate (drift detection)
    3. pnpm design:validate (token schema validation)
    4. pnpm governance:validate (HOTL mode enforcement)
    5. pnpm compatibility:refresh (update manifest)
    6. pnpm check (lint + typecheck + test + build)
    7. pnpm test:e2e (Playwright)
    8. semantic-release (version tag)
    9. Docker build (3 images)

  AI-Companion-Mobile:
    1-6. Same validation sequence
    7. Maestro E2E
    8. semantic-release (version tag)
    9. EAS Build (staging → production)

Phase 4: Coordinated deployment
  Web: Docker images → K8s (canary 10% → 50% → 100%)
  Mobile: EAS Submit → TestFlight/Internal → Store release
```

### Release Gating Rules

| Gate | Blocks Release If |
|------|------------------|
| Contract validation | Any upstream contract drift detected |
| Design validation | Token schema mismatch |
| Governance validation | Mode not HOTL in production build |
| Compatibility matrix | Any pinned version behind by major version |
| Security audit | Any critical/high CVE |
| Bundle budget | Main chunk > 250KB gzipped |
| Lighthouse | Performance < 0.8, accessibility < 0.9 |
| E2E | Any critical flow failure |

### Breaking Change Protocol

1. Upstream repo publishes major version bump (e.g., v2.0.0)
2. Upstream monitor workflow in experience repos detects major bump
3. GitHub Issue auto-created: "Breaking upstream: [repo] v2.0.0"
4. Experience repo team creates branch: `contracts/upgrade-[repo]-v2`
5. Codegen runs, tests run, compatibility matrix updated
6. PR requires architecture team review (2 approvals)
7. After merge: downstream release follows normal sequence

---

## 5. Final Governance Model

### Ownership Matrix

| Artifact | Owner (Produces) | Consumers | Change Requires |
|----------|-----------------|-----------|----------------|
| OpenAPI specs | Backend repos | Experience repos | Backend team review |
| Proto definitions | AI-Software-Factory | AI-Frontend-Experience | Backend + architecture review |
| Design tokens (JSON) | Design-Factory_Figma | Both experience repos | Design engineering review |
| Route maps | Design-Factory_Figma | Both experience repos | Design + frontend review |
| Component specs | Design-Factory_Figma | Both experience repos | Design engineering review |
| State maps | Design-Factory_Figma | Both experience repos | Design + frontend review |
| Stitch concepts | Design-Factory_Stitch | Design-Factory_Figma | Design team review |
| Generated web clients | AI-Frontend-Experience | Web apps | Auto-generated, PR review |
| Generated mobile clients | AI-Companion-Mobile | Mobile app | Auto-generated, PR review |
| Governance manifest | Architecture team | All repos | Architecture review (2 approvals) |
| Compatibility manifest | Auto-generated | CI validation | No manual changes |

### CODEOWNERS (Per Repo)

**AI-Frontend-Experience:**
```
*                              @stratogroup/frontend-leads
apps/software-factory-web/     @stratogroup/sdx-frontend
apps/platform-automation-web/  @stratogroup/platform-frontend
apps/docs-portal/              @stratogroup/docs-team
packages/auth/                 @stratogroup/security
packages/api-clients/          @stratogroup/api-team
packages/design-tokens/        @stratogroup/design-engineering
packages/ui/                   @stratogroup/design-engineering
packages/observability/        @stratogroup/sre
contracts/                     @stratogroup/architecture
governance/                    @stratogroup/architecture
```

**AI-Companion-Mobile:**
```
*                              @stratogroup/mobile-leads
apps/operator-mobile/          @stratogroup/mobile-team
packages/auth-mobile/          @stratogroup/security
packages/api-mobile-clients/   @stratogroup/api-team
packages/ui-mobile/            @stratogroup/design-engineering
contracts/                     @stratogroup/architecture
governance/                    @stratogroup/architecture
```

### Review Requirements

| Change Scope | Required Reviewers | Approvals |
|-------------|-------------------|-----------|
| App-only code | App team lead | 1 |
| Shared package | Package owner + 1 consumer team | 2 |
| Contract sync | Architecture team | 2 |
| Governance manifest | Architecture + security | 2 |
| Breaking API change | Architecture + all affected teams | 3 |

---

## 6. Governance Mode Model: HOTL / HITL / FULL_AUTONOMY

### Mode Definitions

| Mode | Name | Meaning | When Used |
|------|------|---------|-----------|
| **HOTL** | Human-Out-of-The-Loop | Human sets policy, system executes within policy boundaries. All destructive/approval/incident actions require explicit user confirmation before execution. | **DEFAULT.** Production. All environments unless explicitly switched. |
| **HITL** | Human-In-The-Loop | Human must approve each action before system executes. Adds second-reviewer requirement for approvals, dual-confirmation for incident response. | Compliance-sensitive tenants. High-risk operations. Audit periods. |
| **FULL_AUTONOMY** | Full Autonomy | System executes all actions without confirmation gates. Only for pre-approved, well-tested workflows in controlled environments. | Staging/development automation. Load testing. CI/CD pipelines only. |

### Mode Switching Protocol

```
1. Developer creates PR modifying governance/manifest.json
2. PR must include:
   a. Updated activeMode value
   b. Updated docs/GOVERNANCE_MODE.md with reason for switch
   c. Audit trail entry with timestamp, author, reason
3. CI runs governance:validate
4. Architecture team reviews (2 approvals required)
5. After merge, apps read mode from env var at runtime
6. Governance mode report generated automatically
```

### Mode Enforcement in Code

| Action | HOTL | HITL | FULL_AUTONOMY |
|--------|------|------|---------------|
| Approve deployment | Confirmation dialog | Confirmation + second reviewer | Auto-execute |
| Acknowledge incident | Confirmation dialog | Confirmation + second reviewer | Auto-execute |
| Acknowledge alert | Confirmation dialog | Confirmation dialog | Auto-execute |
| Execute workspace action | Confirmation dialog | Confirmation + reason required | Auto-execute |
| Reject approval | Confirmation + reason | Confirmation + reason + second reviewer | Auto-execute |
| Escalate incident | Confirmation dialog | Confirmation + second reviewer | Auto-execute |

### Non-Bypassable Controls (Active in ALL Modes)

These controls execute regardless of governance mode:

1. **Policy checks** — SpiceDB authorization validation
2. **Compatibility validation** — Contract drift detection
3. **Release documentation** — Changelog and version required
4. **Docs validation** — Architecture docs must be current
5. **Security validation** — No critical/high CVEs
6. **Design handoff validation** — Token schema must match
7. **Generated client validation** — Clients must compile

---

## 7. Ownership Model

### Layer Ownership

| Layer | Primary Owner | Secondary Owner |
|-------|--------------|----------------|
| Design | Design Team | Design Engineering |
| Backend/Control | Platform Engineering + Software Engineering | Architecture |
| Experience | Frontend Engineering + Mobile Engineering | Design Engineering |

### Cross-Cutting Ownership

| Concern | Owner |
|---------|-------|
| 3-layer model integrity | Architecture team |
| Contract schemas | Producing repo's team |
| Compatibility manifests | Auto-generated (architecture validates) |
| Governance mode | Architecture + security |
| Security posture | Security team |
| Observability | SRE team |
| Design token pipeline | Design engineering |
| i18n translations | Product + localization team |

---

## 8. Cleanup/Refactor Plan

### Immediate (Before Release)

| # | Action | Repo | Files |
|---|--------|------|-------|
| 1 | Add `governanceMode` to feature flags | Both | `packages/config/src/features.ts` |
| 2 | Create GovernanceGate component | Web | `packages/ui/src/components/governance-gate.tsx` |
| 3 | Create mobile GovernanceGate | Mobile | `packages/ui-mobile/src/governance-gate.tsx` |
| 4 | Wrap approval mutations in governance gate | Both | `packages/api-clients/src/hooks/queries.ts`, mobile `index.tsx` |
| 5 | Wrap incident/alert mutations in governance gate | Both | Same files |
| 6 | Update AGENTS.md with current state | Both | `AGENTS.md` |

### Post-Release

| # | Action | Repo | Effort |
|---|--------|------|--------|
| 7 | Extract `@bac/governance` shared package | Web | 2 days |
| 8 | Add HOTL audit trail logging | Both | 1 day |
| 9 | Add governance mode badge to app shell | Both | 0.5 day |
| 10 | Consolidate 22 mobile docs into subdirectories | Mobile | 0.5 day |
| 11 | Add governance E2E tests | Both | 2 days |
| 12 | Mark old FINAL_ARCHITECTURE_REVIEW.md as superseded | Both | 0.5 day |

---

## 9. Next-Phase Backlog

### Phase 6: Governance Hardening (Weeks 21-22)

| # | Item | Repo |
|---|------|------|
| 1 | GovernanceGate component (web + mobile) | Both |
| 2 | Runtime governance mode flag | Both |
| 3 | HOTL confirmation on all destructive actions | Both |
| 4 | Governance audit trail | Both |
| 5 | Governance mode badge in UI | Both |

### Phase 7: Production Verification (Weeks 23-24)

| # | Item | Repo |
|---|------|------|
| 6 | Full Playwright E2E with governance gates | Web |
| 7 | Full Maestro E2E with governance gates | Mobile |
| 8 | Staging dry-run with real backend APIs | Web |
| 9 | EAS production build validation | Mobile |
| 10 | Security penetration test | Both |

### Phase 8: Multi-Tenant Hardening (Weeks 25-26)

| # | Item | Repo |
|---|------|------|
| 11 | Tenant isolation in BFF proxy | Web |
| 12 | Per-tenant feature flag overrides | Both |
| 13 | Tenant-scoped audit log | Both |
| 14 | Multi-tenant workspace switching (full) | Both |
| 15 | Tenant onboarding wizard | Web |

### Phase 9: Advanced Integration (Weeks 27-28)

| # | Item | Repo |
|---|------|------|
| 16 | Real-time GraphQL subscription rollout | Web |
| 17 | Push notification E2E with real FCM/APNs | Mobile |
| 18 | Cross-repo health dashboard (all 6 repos) | Web |
| 19 | Automated contract upgrade PRs | Both |
| 20 | Cross-repo release train automation | Both |

### Phase 10: Scale and Expansion (Weeks 29-30)

| # | Item | Repo |
|---|------|------|
| 21 | CDN optimization for static assets | Web |
| 22 | Service worker for offline web | Web |
| 23 | React Native New Architecture migration | Mobile |
| 24 | Micro-frontend evaluation for future products | Web |
| 25 | Seventh repo template (for new product addition) | Central |

---

## 10. ADR Updates

### ADR-018: HOTL as Default Governance Mode (NEW)

**Status:** Accepted
**Context:** The ecosystem supports three governance modes (HOTL, HITL, FULL_AUTONOMY) for controlling human oversight of automated actions. Production deployments must default to maximum safety.
**Decision:** HOTL is the default and only mode allowed in production without explicit architecture team approval. HITL adds second-reviewer gates. FULL_AUTONOMY is restricted to staging/CI.
**Consequences:** All destructive actions (approvals, incident acknowledgment, workspace mutations) must pass through a GovernanceGate component. Mode switching requires a PR to `governance/manifest.json` with 2 architecture approvals.

### ADR-019: Governance Mode as Runtime Feature Flag (NEW)

**Status:** Accepted
**Context:** The governance manifest (`governance/manifest.json`) is a CI/development artifact. Application code needs runtime access to the governance mode.
**Decision:** Add `governanceMode` to the feature flag interface in both `@bac/config` and `@bac-mobile/config`. Read from `NEXT_PUBLIC_BAC_GOVERNANCE_MODE` / `EXPO_PUBLIC_BAC_GOVERNANCE_MODE`. Default to `'HOTL'` when not set.
**Consequences:** GovernanceGate components can check mode at render time. Different environments can run different modes. Production defaults to HOTL without any env var.

### ADR-020: GovernanceGate Component Pattern (NEW)

**Status:** Accepted
**Context:** Destructive actions across both experience repos need governance-mode-aware confirmation.
**Decision:** Create a shared GovernanceGate component that wraps action triggers. In HOTL mode: shows confirmation dialog with action summary. In HITL mode: shows confirmation + requires second approver. In FULL_AUTONOMY mode: executes immediately.
**Consequences:** All mutation hooks that trigger destructive backend actions must be wrapped in GovernanceGate. This applies to: approval decisions, incident acknowledgment, alert acknowledgment, workspace actions, escalations.

### ADR-021: Non-Bypassable Controls (NEW)

**Status:** Accepted
**Context:** Some validation controls must run regardless of governance mode to prevent infrastructure damage.
**Decision:** Seven controls are non-bypassable: policy checks, compatibility validation, release documentation, docs validation, security validation, design handoff validation, generated client validation. These run in CI and cannot be skipped by any governance mode.
**Consequences:** Even in FULL_AUTONOMY mode, these controls gate releases. They protect contract integrity, security posture, and documentation currency.

### ADR-022: Superseding Architecture Review Documents (NEW)

**Status:** Accepted
**Context:** Multiple architecture review documents exist (`ARCHITECTURE_REVIEW.md`, `FINAL_ARCHITECTURE_REVIEW.md`, `FINAL_ECOSYSTEM_REVIEW.md`) creating confusion about which is authoritative.
**Decision:** `FINAL_ECOSYSTEM_REVIEW.md` is the authoritative review. All prior review documents must include a superseded header redirecting to this document.
**Consequences:** Codex and Antigravity use only `FINAL_ECOSYSTEM_REVIEW.md` for current state assessment. Prior documents remain for historical audit trail.

---

## 11. Long-Term Scaling Notes

### Adding a 7th Repository

When the ecosystem grows (e.g., `AI-Marketplace` or `AI-Analytics-Engine`):

1. Assign it to one of the 3 layers (Design, Backend/Control, Experience)
2. Add it to `ECOSYSTEM_REPO_CATALOG.md` with GitHub description
3. Add it to `ECOSYSTEM_FOLDER_TREE.md` with folder structure
4. If it produces contracts: add it to `CONTRACT_OWNERSHIP.md` as a producer
5. If it consumes contracts: add `contracts/upstreams/<new-repo>/` to consumer repos
6. Add it to `compatibility/manifest.json` in all consuming repos
7. Create `AGENTS.md` following the established template
8. Create `governance/manifest.json` with HOTL default
9. Add to upstream-monitor.yml in consuming repos

### Architectural Limits to Watch

| Concern | Current | Threshold | Action When Hit |
|---------|---------|-----------|----------------|
| Web monorepo apps | 3 | 5 | Evaluate module federation / micro-frontends |
| Mobile app count | 1 | 2 | Split packages into shared workspace |
| Shared web packages | 10 | 15 | Consider package consolidation |
| Proto services | 12 | 20 | Consider proto package splitting |
| CI pipeline time | ~15 min | 30 min | Add Turbo remote cache, parallel jobs |
| Upstream contracts | 4 | 8 | Automate contract sync via dedicated service |

### Technology Migration Path

| Current | Target (12-18 months) | Trigger |
|---------|----------------------|---------|
| Next.js 15 | Next.js 16+ | When stable, evaluate RSC improvements |
| Expo 52 / RN 0.76 | Expo 54+ / New Architecture | When bridgeless mode is production-ready |
| TanStack Query v5 | v6 (if released) | Only on major API improvements |
| Tailwind v3 | Tailwind v4 | When ecosystem plugins stable |
| Storybook 8 | Storybook 9 | When addon ecosystem migrates |

---

## Final Operating Note (Enforceable Rule)

**This operating rule is binding on all ecosystem participants, including Codex and Antigravity.**

Before any implementation or verification work begins on any repository in this ecosystem, the following 3 baseline artifacts must be present and consulted:

1. **ECOSYSTEM_REPO_CATALOG.md** — Authoritative list of all 6 repos with GitHub descriptions. No repo may be added, removed, or redescribed without updating this file.
2. **ECOSYSTEM_FOLDER_TREE.md** — Exact folder structure for all 6 repos. No structural changes without updating this file.
3. **ECOSYSTEM_LAYER_MODEL.md** — 3-layer strategic model (Design, Backend/Control, Experience). No repo may change layers without architecture team approval.

**Enforcement:**
- Codex must read these 3 files before starting any task
- Antigravity must validate against these 3 files before approving any work
- Any PR that contradicts these files must be rejected
- These files live in both experience repos at `docs/` and centrally at `/Users/AbiolaOgunsakin1/Workflows/`

**Governance default:** HOTL. Any change to HITL or FULL_AUTONOMY requires a PR with architecture team review. FULL_AUTONOMY is prohibited in production without explicit CTO approval.

---

*End of Final Ecosystem Review*
*Version 2.0.0 — 2026-03-23*
*Supersedes: FINAL_ARCHITECTURE_REVIEW.md, ARCHITECTURE_REVIEW.md*
