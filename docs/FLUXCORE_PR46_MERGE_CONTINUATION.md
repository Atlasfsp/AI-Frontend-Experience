# FluxCore frontend PR #46 continuation — 2026-10-28

The owner requested committing, pushing, resolving conflicts and merging all source PRs. This source integration does not authorize production deployment, paid Actions, provider spending or a GA declaration.

The four-provider catalog remains read-only and source-only. All providers remain NOT_CONNECTED and NOT_VERIFIED_LIVE, with no claimed runtime rights or verified release receipts. ADR-006/007 and HOTL governance remain in force.

Local verification exposed a React 19.3.1 / React DOM 19.3.0 mismatch that prevented all software-factory test suites from loading. Workspace React/DOM dependencies are pinned to the same published 19.3.1 version and the pnpm lockfile is refreshed. TypeScript 6 also required removing deprecated baseUrl (keeping relative path mappings), declaring Node ambient types and explicitly setting the workspace rootDir for cross-package source imports. The provider test now explicitly rejects missing candidate IDs instead of indexing possibly absent entries.

A browser regression covers navigation from settings to the provider catalog, four disconnected candidates, unverified observations and absence of credential inputs or provider action buttons. Local browser testing uses the existing mock login only; it is not live identity/provider qualification.

GitHub Actions on the previous PR SHA did not execute: the check annotation says the account is locked due to a billing issue. No payment or rerun was attempted. Commits and the requested normal SHA-matched merge use skip-CI markers. Local results and final merge receipts are recorded alongside the engineering handoff; they are author-run checks, not independent release evidence. Backend issues #55 and #56 remain open.

Library builds now use separate src-rooted emit configurations and resolve dependencies through their built package declarations. Source lint/type checks retain workspace source aliases. This preserves declared dist entry points despite the TypeScript 6 rootDir change; domain-contracts now also declares its built outputs. The root build verifies all 32 published JavaScript/declaration entry targets exist. No generated backend client source was edited.

Final local verification: workspace lint and strict type checks, 45 unit tests, two integration-script tests, 14 tooling/security regression tests, three production app builds and all 32 built package entry points passed. `pnpm test:e2e:fluxcore` passed its Chromium provider catalog test using only localhost port 3310 and a mock session. Contract/design/governance/docs/release/smoke validators and frozen offline installation passed. Existing Next middleware/cache-header and standalone-start notices remain non-fatal; these checks establish source behavior only.
