# AG-05 Create intake implementation evidence

Canonical repository: AI-Frontend-Experience. Existing route `/software-factory/prd-intake`, screen ID `software-factory-prd-intake` retained; navigation labels it FluxCore Create. Existing PRD guidance retained. No new app or duplicate project/agent service.

Inspected before implementation: repository AGENTS.md, existing PRD intake/workspace screens, app shell/session/BFF/navigation, enterprise design tokens, canonical consumed Figma frontend route map. Repository contained no PNG/JPG screenshot artifacts in inspected Design-Factory paths. Preserved existing dark surfaces, rounded cards, typography, primary token and shared shell. No screen-catalogue entries removed or claimed newly generated.

Implemented: conversational application idea plus optional custom industry; authenticated existing SDX BFF compile call; validated unverified proposed workforce with domain expert, engineering roles, risk tiers, required gates, returned payload inspection, unknown-cost display. No execution action available. Editing input invalidates the current proposal and rejects stale in-flight responses. Errors replace success evidence. Labels, live result region, pending state, focus styles and responsive width use existing patterns.

Shared context: signed session tenant/workspace shown; Engineer link opens the existing workspace selector using the same session. Project persistence, repository binding and cross-surface proposal persistence are **not implemented** and explicitly disclosed. No generated files, staffed agents, passed application tests, preview or deployment is claimed.

Validation:
- `pnpm install --frozen-lockfile`: failed because existing lockfile lacks `@bac/auth` in api-clients importer. `pnpm install --no-frozen-lockfile` succeeded; no tracked lockfile delta resulted.
- `pnpm exec vitest run apps/software-factory-web/components/create-intake.test.tsx`: 3 passed. Initial run exposed missing React import in the test runtime; corrected before passing rerun.
- `pnpm exec eslint apps/software-factory-web/components/create-intake.tsx apps/software-factory-web/components/create-intake.test.tsx 'apps/software-factory-web/app/(app)/software-factory/prd-intake/page.tsx'`: exit 0, existing Next pages-directory warning.
- `pnpm --filter @bac/software-factory-web typecheck`: fails on existing feature-flags `boolean | GovernanceMode` assignment, next.config `assetPrefix` exact optional property, and config tenant-overrides `expiresAt` exact optional property. No changed-file type errors after corrections.

Limitations: UI uses a consumer-side runtime schema against backend-owned compile contract rather than hand-editing generated clients. Upstream contract publication/client generation remains required. No running backend/browser acceptance test, visual screenshot, persistent project creation, SME verification, deployment or production approval evidence. Compile endpoint now requires existing `workspace:manage` planning permission at the BFF; other mutations retain deployment permission. Backend workflow-plan capability remains independently enforced; no permission bypass added. Do not interpret this slice as complete AG-05 or AG-00–AG-08 closure.

Next verification: publish backend OpenAPI additive contract, regenerate authoritative clients, wire existing project aggregate/persistence, execute live signed-session acceptance tests and responsive/accessibility visual review. Preserve HOTL gates and independently governed integration/provider/model/production approvals.


## Closure verification follow-up

Baseline type errors corrected separately in commit `46046c8`: admin registry restricts keys to boolean flags, absent CDN prefix and absent override expiry omit optional properties, and Next config imports the pure CDN module rather than a React-bearing barrel. `pnpm --filter @bac/software-factory-web typecheck` now exits 0.

Focused Vitest suite: `pnpm exec vitest run apps/software-factory-web/lib/sdx-permissions.test.ts apps/software-factory-web/components/create-intake.test.tsx packages/config/src/index.test.ts packages/config/src/tenant-overrides.test.ts` — 4 files, **10 tests passed**. Covers anonymous/viewer denial, exact compile planning permission versus deployment mutations, custom industry, failed/malformed response, null/missing cost, escaped untrusted expert/domain strings, optional tenant expiry and config defaults.

The supplied Antigravity reference path ending `fc_001_executive_command_center/screen.png` was inspected with `file` and the image tool: it is 28-byte ASCII text, not a valid image, and the image tool rejected it. Existing source design tokens and canonical layout remain the visual authority actually inspected. No successful visual comparison against that invalid file is claimed.

Browser acceptance: `node scripts/acceptance/create-fixture.mjs` passed using local Next development app on port 3400, installed Chromium headless shell, existing signed mock-login session, real authenticated BFF, and explicitly labelled local HTTP fixture on 8080. Anonymous compile returned 403 with zero upstream requests. Authenticated forwarding preserved fixture tenant/workspace and authorization header. Custom-domain proposal displayed blocked execution and unknown cost; editing invalidated results; Engineer link reached existing workspace selector. Saved `create-fixture/acceptance.json`, `create-1440.png`, `create-390.png`; both document widths equal viewport widths. These are fixture UI acceptance evidence, not live backend/model/SME/identity/deployment evidence. Cold first attempt timed out during Next compilation; increased local test timeout and reran successfully.

Visual QA exposed missing Tailwind scan coverage for shared `packages/ui/src`. Added explicit `@source` to existing app CSS so canonical shell/sidebar responsive classes are emitted; no token or component redesign. Screenshot script resets scroll and waits for resize transitions before capture. Existing PRD readiness values remain static blueprint/demo content, not test or compliance measurements for the submitted application.
