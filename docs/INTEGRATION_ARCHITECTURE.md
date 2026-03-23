# Integration Architecture

Canonical source of truth: the workspace-level `Claude-Master-Architecture-Package`, anchored by `docs/MASTER_ECOSYSTEM_ARCHITECTURE.md` and its machine-readable manifests.

Authoritative baseline references:

- `ECOSYSTEM_REPO_CATALOG.md`
- `ECOSYSTEM_LAYER_MODEL.md`
- `ECOSYSTEM_FOLDER_TREE.md`
- `CONTRACT_OWNERSHIP.md`
- `COMPATIBILITY_MATRIX.md`
- `CROSS_REPO_RELEASE_FLOW.md`
- `LOCAL_INTEGRATION_GUIDE.md`

`AI-Frontend-Experience` is a consumer repo that binds together:

- Software Factory backend contracts from `AI-Software-Factory`
- Platform Automation backend contracts from `AI Platform Automation`
- canonical design handoff contracts from `Design-Factory_Figma`
- exploratory screen-map context from `Design Factory_Stitch`

## Integration model

- upstream producer artifacts are snapshotted under [`contracts/upstreams`](/Users/AbiolaOgunsakin1/Workflows/AI-Frontend-Experience/contracts/upstreams)
- client bindings are generated into [`packages/api-clients`](/Users/AbiolaOgunsakin1/Workflows/AI-Frontend-Experience/packages/api-clients)
- design drift validation checks Figma route maps, component specs, state maps, and tokens against implemented routes, state surfaces, and shared UI components, while Stitch screen maps provide exploratory route-traceability coverage
- compatibility rules are defined in [`compatibility/manifest.json`](/Users/AbiolaOgunsakin1/Workflows/AI-Frontend-Experience/compatibility/manifest.json)
