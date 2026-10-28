# FACTORY-006 — Workloads operator UX (source-only first wave)

Workload management is **not** the UI inside future software products. It is the operational inventory for what FluxCore is building, testing, scheduling, delivering or observing. The five first-class categories are (1) engineering job, (2) independent CI build, (3) authorized preview/staging, (4) runtime service and (5) data/infrastructure task. The existing `/software-factory/work-items` page manages intake requirements; `/software-factory/builds` manages reported builds; the new `/software-factory/workloads` is the **cross-lifecycle overview** that links them, not a replacement.

## Committed source

- `apps/software-factory-web/app/(app)/software-factory/workloads/page.tsx` renders the accessible five-family control hub and truthfully reports **NOT CONNECTED**.
- `apps/software-factory-web/features/workload-registry.ts` defines a tenant/repo/commit-bound workload read model and a no-data integration blocker.
- `contracts/workloads/workload-record.v1.schema.json` is the proposed strict interoperable read schema. Do not treat `evidenceState=TRUSTED_CI_VERIFIED` as a client-supplied truth: the BFF must verify real issuer/runner/source evidence.
- Factory navigation/route permissions now include Workloads with `workspace:view`. Actual actions require their **own** server-side admission; navigation authorization is NOT approval to change workload state.
- `features/workload-registry.test.ts`: three authored source tests for five distinct kinds, absent API honest empty state and no release authority. **Not yet executed under the canonical pnpm/Next runner.**

## Production acceptance architecture

**Source owners:** FluxCore native Go control-plane owns work identity, scheduling, execution and costs; Jenkins/Tekton provides independent exact-SHA build evidence; AppForge builds/packages and Droplet audits; SkyForge owns approved staging and production transitions; VRQGO/OpsTrac owns real OTel runtime metrics; StratoID owns tenant/workspace identity, permissions and audit. This frontend never invents a new orchestration engine or bypasses existing FluxCore ADR-002.

1. Define an authenticated `GET /v1/workloads` and `GET /v1/workloads/{id}` BFF that returns exact authenticated tenant/workspace ownership, immutable source SHA, observed timestamp, evidence provenance, optionally signed issuer reference, type, lifecycle, resource and cost (unknown = null, never 0). Current route has NO backend call.
2. Schema validation must fail closed on unknown tenant, malformed commit, stale evidence, missing rights, wrong environment, unverified signed CI claim, cross-tenant reference or missing source.
3. In the BFF, separate evidence-reported status from independently verified checks; show **DEMO**, **API_REPORTED_UNVERIFIED**, **STALE**, **UNAVAILABLE** and **TRUSTED_CI_VERIFIED** only from independent verifier response. No browser verification assumptions.
4. Introduce web route detail, dependencies, lifecycle, environment matrix, signed evidence and incident views in the catalog screens 009–040 as their corresponding API contracts are approved.
5. Build an optional authorized workload create/request action only after FluxCore protected admission, StratoID RBAC and tenant/work quota. No v0 or OpenHands agent action is authorized just by opening the UI.
6. Run full Next.js/TypeScript/Vitest/Playwright + a11y and isolation checks on exact commit, then protect and deploy a staging preview through approved CI. As of this source commit **the CI, preview and production gates have not executed**.

## Stitch and code-generation ownership

Design sources are under `Atlasfsp/FluxCore-Engineering/docs/ui/stitch/`: **180-screen catalog**, `DESIGN.md` and Batch 01 (FC-001–FC-020) prompts. Stitch is for high-fidelity concept and prototype design, **Vercel v0** remains the mandatory frontend source-generation engine per FluxCore mandatory-stack contract. Approved artboards must go through v0-generated reviewed diffs, then the existing frontend package and independent Jenkins/Tekton, not straight to production.

**No per-customer app internal screens are proposed.** Workload service detail, run history and previews reflect backend metadata/observations only. Never show a fake screenshot of a product that has not been generated.
