# AGENTS.md

## Repo purpose
- This repo is the unified web frontend experience layer for AI Software Factory and AI Platform Automation, including shared UI, design tokens consumption, docs portal, and Swagger/API explorer experiences.
- Preserve the 3-layer model from `../ECOSYSTEM_LAYER_MODEL.md`. This repo is in the experience layer and consumes backend contracts and final design handoff artifacts.
- Treat `../CONTRACT_OWNERSHIP.md`, `../COMPATIBILITY_MATRIX.md`, `../CROSS_REPO_RELEASE_FLOW.md`, and `../Claude-Master-Architecture-Package/docs/MASTER_ECOSYSTEM_ARCHITECTURE.md` as authoritative before changing cross-repo behavior.

## Commands to run
- `pnpm dev`
- `pnpm dev:software-factory`
- `pnpm dev:platform`
- `pnpm contracts:generate`
- `pnpm contracts:validate`
- `pnpm design:validate`
- `pnpm integration:check`
- `pnpm check`

## Where contracts live
- Generated web clients: `packages/api-clients/src/generated/`
- Client manifest: `packages/api-clients/contracts/generated-client.manifest.json`
- Upstream sources: `contracts/upstream-sources.json`
- Consumed upstream snapshots: `contracts/upstreams/`
- Compatibility: `compatibility/manifest.json`
- Repo-local integration docs: `docs/CLIENT_GENERATION.md`, `docs/INTEGRATION_ARCHITECTURE.md`, and `docs/COMPATIBILITY_MATRIX.md`
- Governance mode: `governance/manifest.json` and `docs/GOVERNANCE_MODE.md`

## What not to change
- Do not redefine backend contracts here. `AI-Software-Factory` and `AI-Platform-Automation` own OpenAPI, proto, and schema truth.
- Do not redefine canonical design handoff here. `Design-Factory_Figma` owns route maps, component specs, state maps, and design tokens.
- Do not hand-edit generated clients under `packages/api-clients/src/generated/`; regenerate them from authoritative upstream artifacts.
- Keep Swagger/OpenAPI explorer behavior as a consumer of backend truth, not an alternate contract source.
- HOTL is the default governance mode for user-facing governed actions. HITL and FULL_AUTONOMY are controlled modes and must not become the default path in code, prompts, or docs.

## What this repo owns vs consumes
- Owns: web implementation, app shells, routes, shared UI packages, docs portal implementation, and backend-for-frontend seams.
- Consumes: authoritative backend contracts from `AI-Software-Factory` and `AI-Platform-Automation`, final design handoff from `Design-Factory_Figma`, and exploratory traceability artifacts from `Design-Factory_Stitch`.
