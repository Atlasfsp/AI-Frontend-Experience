# Integration Architecture

`AI-Frontend-Experience` is a consumer repo that binds together:

- Software Factory backend contracts from `AI-Software-Factory`
- Platform Automation backend contracts from `AI Platform Automation`
- canonical design handoff contracts from `Design-Factory_Figma`
- exploratory concept context from `Design Factory_Stitch`

## Integration model

- upstream producer artifacts are snapshotted under [`contracts/upstreams`](/Users/AbiolaOgunsakin1/Workflows/AI-Frontend-Experience/contracts/upstreams)
- client bindings are generated into [`packages/api-clients`](/Users/AbiolaOgunsakin1/Workflows/AI-Frontend-Experience/packages/api-clients)
- design drift validation checks Figma route maps, component specs, and tokens against implemented routes and shared UI components
- compatibility rules are defined in [`compatibility/manifest.json`](/Users/AbiolaOgunsakin1/Workflows/AI-Frontend-Experience/compatibility/manifest.json)
