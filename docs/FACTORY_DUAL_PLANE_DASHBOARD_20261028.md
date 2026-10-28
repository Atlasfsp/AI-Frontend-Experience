# AI Factory dual-plane command dashboard — FACTORY-006 companion

**Date 28 October 2026. Status: frontend source committed to review branch only; NO live delivery evidence or production release is claimed.**

## Existing data seams and corrected semantics

The existing dashboard at `apps/software-factory-web/app/(app)/software-factory/dashboard/page.tsx` retrieved the overview, build and work lists through `@bac/api-clients`. The API client can serve deterministic `mock/data` when `enableMockApi` is set, which defaults to true in `packages/config/src/env.ts`. The dashboard previously displayed hard-coded `buildTrendChart` values (11 passed, 4 in review, 2 blocked, 7 queued) and `softwareFactoryTimeline` beside live-looking operational metrics. **Those fixtures are NOT actual production outcomes.**

This PR removes those chart/timeline uses from the dashboard and adds two distinct planes through `features/dual-plane-command-center.tsx`:

1. **Factory Operations / AI Brain:** agent registry, work queue, OpenHands session status, model/token/cash telemetry, links to the existing agent/activity/work views. Where OpenHands event-stream or signed FluxCore model cost receipts are not connected, show **Not connected** rather than inventing them.
2. **Application Delivery / Shipped Code:** reported build count, independent signed Jenkins/Tekton CI state, preview/APK/TestFlight registry, staging/production OTel health. In the absence of signed delivery receipts/tenant-gated preview API, show **Not connected/Unverified**. Do not allow UI to authorize deployment.

A standalone source-classifier `features/telemetry-provenance.ts` makes demonstration data explicitly `DEMO`, reachable API values `API_REPORTED_UNVERIFIED`, and partial upstream errors `UNAVAILABLE`. If production has mock mode enabled it **fails closed** as unavailable. There is no invented `TRUSTED_CI_VERIFIED` status, which will require a signed, tenant-bound evidence verification API. Root summary numbers do not display in production demo or upstream-unavailable cases.

## Future trusted service contracts

The backing service must supply `tenant_id`, `workspace_id`, `repository`, `commit_sha`, `collected_at`, `source_system`, `verification_state`, `evidence_ref` with every operational aggregate; independently validated FACTORY-006 signed CI receipts, real job attempt IDs, package OCI digests, preview URL with TTL and RBAC, verified OpenHands agent session/audit reference, model usage/cost per accepted task, and deployment marker/OTel health. The browser must never receive model API keys, CI runner signing keys or raw OpenShell credentials.

For production:
- read through authenticated BFF; enforce tenant/workspace RBAC and deny direct browser-to-Jenkins or browser-to-Agent-Server bypass.
- verify public HTTPS preview URLs are tenant scoped and expire, and show Git commit, build source, screenshot/ephemeral artifact only after review.
- add Grafana panels/tabs for source-verified model token/cash, repair attempts, queue throughput; release marker with error/p95 latency, rollback and security statuses.
- push failures into FluxCore's scoped task queue, max three approved repair attempts, no automatic merge/deploy.
- no permanent preview URLs or APK/TestFlight link invented by this frontend source branch.

## Evidence and limits

The branch includes four authored `vitest` tests in `features/telemetry-provenance.test.ts`: mock is demo, reachable API unverified, unavailable upstream, and mock production hard block. **Not executed** in this turn because there is no provisioned pnpm full repository build runner. TypeScript compilation, UI screenshot/Playwright and release regression checks remain OPEN; do not label them PASS. No API, backend, OpenHands, Jenkins, Tekton, VRQGO or staging deployment was changed by this PR.

Paired workstreams: [atlas-factories PR #5](https://github.com/Atlasfsp/atlas-factories/pull/5) (canonical evidence policy) and [atlas-devops PR #2](https://github.com/Atlasfsp/atlas-devops/pull/2) (review-only Jenkins/webhook lane). Existing frontend release blocker [issue #41](https://github.com/Atlasfsp/AI-Frontend-Experience/issues/41) remains OPEN.

## Review gates

- [x] Split factory operations from app delivery and remove static green chart/timeline.
- [x] Suppress fabricated success/verified statuses; production mock mode fail closed.
- [x] Draft four source-classifier tests.
- [ ] Run `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` and Playwright on exact SHA.
- [ ] Independent UI/security review for Authentik/SpiceDB tenant scope and data leakage.
- [ ] Implement authenticated signed-CI, OpenHands event, cost and preview BFF adapters in distinct approved backend PRs.
- [ ] Controlled staging preview of this dashboard, then separately approve production promotion and rollback.

**No release evidence = no release claim.**
