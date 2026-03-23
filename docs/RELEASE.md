# Release Guide

This document describes the current release posture for `AI-Frontend-Experience`.

## Goal

The purpose of a release in this repository is to produce deployable, validated web experiences for:

- AI Software Factory
- AI Platform Automation
- Docs Portal

This repo already enforces build-quality gates. Deployment-target automation can be layered on top once hosting, secrets, preview targets, and package-publishing decisions are finalized.

## Current release automation

GitHub Actions workflows already provide the quality foundation:

- `pr.yml`
  - runs install, lint, typecheck, test, and build on pull requests to `main`
- `push.yml`
  - runs `pnpm check` on pushes to `main`
- `release.yml`
  - manual workflow that validates package readiness and build output

Today, the release workflow is intentionally a validation-first foundation rather than a fully automated deployment pipeline.

## Release principles

- no release without a passing build
- no release without a passing typecheck
- no release without tests passing
- no release based on local-only confidence
- no undocumented environment change during release execution

## Pre-release checklist

Before running a release:

- merge target changes into `main`
- ensure CI is green on the exact commit being released
- confirm `.env` values for the target environment are available through the deployment system
- confirm Authentik callback URLs match the target domains
- confirm Hasura, SDX, and Swagger endpoints are correct for the environment
- confirm any feature flags are intentionally set
- confirm docs changes are included if behavior or route inventory changed

## Local release preflight

Run from the repo root:

```bash
pnpm install --no-frozen-lockfile
pnpm check
```

If contracts changed, also run:

```bash
pnpm sync:proto
pnpm sync:openapi
pnpm sync:tokens
pnpm check
```

## Environment checklist

At minimum, release environments need:

- `BAC_SESSION_SECRET`
- Authentik client id and client secret
- correct authorize, token, issuer, and logout URLs
- `BAC_AUTH_CALLBACK_URL` for each deployed app
- `NEXT_PUBLIC_BAC_SDX_API_URL`
- `NEXT_PUBLIC_BAC_PLATFORM_API_URL`
- `NEXT_PUBLIC_BAC_HASURA_URL`
- `NEXT_PUBLIC_BAC_SWAGGER_URL`
- feature flag values appropriate for the environment

## Release flow

### 1. Prepare the release candidate

- verify route-level changes are intentional
- verify shared package changes did not introduce cross-app regressions
- verify docs still match runtime behavior

### 2. Validate locally

- run `pnpm check`
- if explorer or proxy behavior changed, sanity-check the affected app locally

### 3. Validate in CI

- ensure PR checks passed
- merge to `main`
- confirm push workflow passed on `main`

### 4. Run manual release workflow

- trigger `.github/workflows/release.yml`
- confirm the workflow completes successfully

### 5. Deploy through the hosting platform

This repo does not yet contain provider-specific deployment automation. The current expectation is:

- build outputs are consumed by the selected hosting platform
- environment variables are injected there
- preview and production domain wiring are managed externally until deployment workflow decisions are finalized

## What is still intentionally external

The following are not yet automated inside this repo:

- preview deployment orchestration
- production deployment orchestration
- semantic version publishing for shared packages
- Lighthouse or synthetic monitoring gates
- post-deploy smoke test automation

Those items should be added only after the target platform and ownership model are finalized.

## Rollback guidance

If a release causes regressions:

- revert to the last known good deployment in the hosting platform
- disable risky feature flags where possible
- if the issue is frontend-only, ship a narrow follow-up patch rather than broad unrelated changes
- update docs if the rollback changes supported behavior

## Release sign-off expectations

Before calling a release complete, confirm:

- authenticated routes still resolve correctly
- Swagger explorer still loads the expected contract source
- GraphQL explorer still executes against the intended environment
- shared shell navigation works across both product apps
- docs portal routes build and render correctly

## Recommended next automation steps

When deployment targets are chosen, extend the release system with:

- preview deployment workflow per app
- environment-specific build promotion
- post-deploy route smoke tests
- release notes generation
- package provenance and artifact retention
