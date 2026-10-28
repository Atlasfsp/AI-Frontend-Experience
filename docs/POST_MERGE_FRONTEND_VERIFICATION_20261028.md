# Post-merge frontend dependency verification — 28 October 2026

**Scope:** source-only review gate for the merged dependency updates; does NOT deploy, disable controls, spend GitHub Actions quota or declare GA.

## Exact baseline
Protected `main` was checked at **`099db6428af29e897af5fc160ebd995778c81631`** following these five previously confirmed squash merges:

| PR | Dependency | Merge commit |
|---|---|---|
| #40 | turbo 2.11.7 to 2.11.10 | `e7f73bf8a99a1341eb8f5ed5366c0735fd7ec1e9` |
| #39 | webpack-dev-middleware 8.3.0 to 8.5.0 | `14d7f77d302d7f356dae1e66562f006e402ec34c` |
| #38 | typescript-eslint 8.71.1 to 8.72.0 | `2827be247fde8e1e52c2c5fafb1c966a97787f31` |
| #36 | Next.js 15.5.27 to 16.4.2 | `c103cf14aba212b71fecfd6910e68795a54c7205` |
| #37 | TypeScript 5.9.3 to 6.0.3 | `099db6428af29e897af5fc160ebd995778c81631` |

The original PRs had **failing GitHub Actions jobs** and the source was merged on the owner's explicit instruction. Git conflict-free mergeability did not establish successful compilation. Blocking issue: [#41](https://github.com/Atlasfsp/AI-Frontend-Experience/issues/41).

## Read-only verification performed

Authenticated GitHub source retrieval compared the merged `main` `package.json`, `pnpm-lock.yaml` and affected workspace manifests. **9/9 selected manifest and lockfile specifier pairs agreed:** root Turbo, TypeScript, typescript-eslint and webpack-dev-middleware, Next 16 in three web apps and `packages/ui`, and TypeScript 6 in `packages/governed-browser`. Root `packageManager` remains `pnpm@9.15.9` and lockfile format `9.0`.

**This check did NOT run `pnpm install`, lint, TypeScript build/typecheck, unit tests, E2E tests, pnpm security audit or application staging.** It validates only selected declarative source pins and cannot prove transitive dependency compatibility, provider safety, browser behavior or runtime quality.

## New source-only safeguards

- `scripts/verify-upgrade-integrity.mjs`: standard-library-only, fail-closed source guard for root toolchain and nine merged dependency/workspace specifiers. No package installations, outbound requests, deployment or external credentials.
- `scripts/verify-upgrade-integrity.test.mjs`: five proposed Node built-in negative tests for consistent fixture, mismatched lockfile, stale Next workspace, incorrect pnpm pin, and missing quality scripts. These tests have been **authored, NOT executed** in this environment.
- `Jenkinsfile.post-merge-review`: a **new, separate, manually configured** Jenkins job definition. Requires trusted `trusted-frontend-review` runner with installed Node 22, pnpm 9.15.9 and warm offline package store; checks immutable SHA before any work; then verifies signed-off manifest pins, negative tests, frozen offline install, lint, typecheck, unit and security tests, integration-script tests, Next/TypeScript production build, optionally E2E, and records logs. There is **no release/deploy stage and no binding of GitHub/provider/secrets**.
- No edits to existing GitHub Actions workflows, production application components, npm package versions, `pnpm-lock.yaml`, protected `main`, or live provider accounts.

## No-clone Mac checkout procedure

In your **existing local `AI-Frontend-Experience` checkout**, never re-clone or reset user changes. First ensure your existing work is committed or safely preserved, then use a trusted terminal:

```sh
git status --short
git fetch origin main ci/post-merge-upgrades-review-20261028
git switch ci/post-merge-upgrades-review-20261028
git pull --ff-only origin ci/post-merge-upgrades-review-20261028
node --version
pnpm --version
node scripts/verify-upgrade-integrity.mjs
node --test scripts/verify-upgrade-integrity.test.mjs
```

For full verified dependency acceptance on a trusted Node 22 / pnpm 9.15.9 workstation with a provisioned offline pnpm store and Playwright browsers:

```sh
pnpm install --offline --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration-scripts
pnpm test:security-audit
pnpm build
CI=true pnpm test:e2e
```

The resulting test logs must be associated with the **exact reviewed commit**. The offline cache requirement may cause missing-package failures. Do not silently fall back to unreviewed network downloads, use production secrets or disable verification steps. Static source-integrity PASS is only one gate.

## Explicit release blockers

- [ ] Independent exact-HEAD execution of the newly authored integrity tests.
- [ ] Offline frozen lockfile install, lint, typecheck, unit tests, security regressions and production build.
- [ ] Real Playwright E2E on three local Next apps, with trace/screenshot artifacts on failure.
- [ ] Vulnerability scan and supply-chain verification; browser performance, accessibility and bundle regressions.
- [ ] Review actual Next.js 16 / TypeScript 6 integration compatibility, including root `@next/bundle-analyzer@15.5.27` and Storybook/Webpack middleware paths; this potential compatibility divergence remains **unverified**, not automatically failed or waived.
- [ ] Independent reviewer approval and release-authorized staging; no production or GA claim.

**Status:** new review branch only, no Jenkins job installed, no paid GitHub Actions trigger, no live deployment. `main` still carries the previously owner-directed dependency merges and unresolved CI evidence.
