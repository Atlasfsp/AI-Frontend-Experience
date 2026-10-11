# Client Generation

## Inputs

- `contracts/upstreams/ai-software-factory`
- `contracts/upstreams/ai-platform-automation`

## Outputs

- [`packages/api-clients/src/generated/contract-registry.ts`](/Users/AbiolaOgunsakin1/Workflows/AI-Frontend-Experience/packages/api-clients/src/generated/contract-registry.ts)
- [`packages/api-clients/contracts/generated-client.manifest.json`](/Users/AbiolaOgunsakin1/Workflows/AI-Frontend-Experience/packages/api-clients/contracts/generated-client.manifest.json)
- synced Connect-ES types in [`packages/api-clients/src/generated/sdx`](/Users/AbiolaOgunsakin1/Workflows/AI-Frontend-Experience/packages/api-clients/src/generated/sdx)

## Flow

1. Run `pnpm contracts:generate`.
   This is the authoritative regeneration entrypoint and always performs upstream sync first.
2. Pull-request CI regenerates from the reviewed, versioned snapshots under `contracts/upstreams/` and fails if generated clients drift.
   The scheduled upstream monitor remains the `github-release` ingestion path and opens a refresh PR after producer releases exist.
   `workspace` remains the local convenience mode when sibling producer repos are present.
3. The web consumer snapshots:
   - `software-factory-openapi`
   - `software-factory-proto`
   - `software-factory-connect-typescript`
   - `platform-automation-openapi`
   - `platform-automation-proto`
4. Run `pnpm compatibility:refresh` when intentionally adopting newer compatible upstream releases so pinned compatibility metadata stays explicit.
5. Commit regenerated bindings and refreshed compatibility metadata when the snapshots changed.
6. CI validates generated outputs, consumed upstream release tags, design state maps, Stitch screen-map coverage, and compatibility manifests.
