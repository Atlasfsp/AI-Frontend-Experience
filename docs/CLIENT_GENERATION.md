# Client Generation

## Inputs

- `contracts/upstreams/ai-software-factory`
- `contracts/upstreams/ai-platform-automation`

## Outputs

- [`packages/api-clients/src/generated/contract-registry.ts`](/Users/AbiolaOgunsakin1/Workflows/AI-Frontend-Experience/packages/api-clients/src/generated/contract-registry.ts)
- [`packages/api-clients/contracts/generated-client.manifest.json`](/Users/AbiolaOgunsakin1/Workflows/AI-Frontend-Experience/packages/api-clients/contracts/generated-client.manifest.json)
- synced Connect-ES types in [`packages/api-clients/src/generated/sdx`](/Users/AbiolaOgunsakin1/Workflows/AI-Frontend-Experience/packages/api-clients/src/generated/sdx)

## Flow

1. Run `pnpm sync:contracts` locally when sibling producer repos are available.
   `BAC_UPSTREAM_SOURCE_MODE=github-release` is the CI and release default, while `workspace` remains the local convenience mode.
2. Run `pnpm contracts:generate`.
3. Commit regenerated bindings when the snapshots changed.
4. CI validates that generated outputs, consumed upstream release tags, design state maps, and compatibility manifests remain in sync.
