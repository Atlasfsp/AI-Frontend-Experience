# Cross-Repo Release Flow

1. A producer repo ships a tagged release using `repo/v<semver>`.
2. Producer CI validates exports, packages machine-readable assets, writes `integration-release-manifest.json`, and uploads the assets to GitHub Releases.
3. `AI-Frontend-Experience` resolves its upstream source map from [contracts/upstream-sources.json](/Users/AbiolaOgunsakin1/Workflows/AI-Frontend-Experience/contracts/upstream-sources.json), downloads the selected release assets, verifies checksums, and records the consumed release tags.
4. Generated client bindings are regenerated against the consumed release set.
5. CI validates contract ranges, producer-to-consumer compatibility rules, generated outputs, design drift including state-map coverage, docs, and smoke assumptions.
6. Web release proceeds only when the consumed upstream release tags remain compatible and are visible in the compatibility report artifact.
