# Local Integration Guide

Use [`.env.integration.example`](/Users/AbiolaOgunsakin1/Workflows/AI-Frontend-Experience/.env.integration.example) when running the full BAC integration stack locally.

## Local integration flow

1. For local workspace integration, leave `BAC_UPSTREAM_SOURCE_MODE=workspace` and start `AI-Software-Factory`, `AI Platform Automation`, `Design-Factory_Figma`, and `Design Factory_Stitch` locally.
2. Run `pnpm sync:contracts` to snapshot the upstream exports into `contracts/upstreams/` and refresh `compatibility/consumed-upstreams.json`.
3. Run `pnpm contracts:generate` to refresh the generated contract registry and client manifest against the currently consumed upstream set.
4. Run `pnpm integration:check` to validate API drift, design-handoff drift, docs coverage, release readiness, and smoke assumptions.
5. Start the web surface you want with `pnpm dev:software-factory`, `pnpm dev:platform`, or `pnpm dev:docs`.

## Released-artifact integration

Use `BAC_UPSTREAM_SOURCE_MODE=github-release` when validating against published producer releases instead of sibling workspaces.

- CI uses `github-release` by default and expects `GITHUB_TOKEN` to be available.
- Local release-asset validation can use a fine-scoped personal access token or `gh auth token`.
- The exact upstream release tags consumed by the repo are written to [compatibility/consumed-upstreams.json](/Users/AbiolaOgunsakin1/Workflows/AI-Frontend-Experience/compatibility/consumed-upstreams.json).
