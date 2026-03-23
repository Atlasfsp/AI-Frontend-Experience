# Adding a New Repository to the BAC Ecosystem

## When to Add a New Repo
- New product domain that doesn't fit existing repos
- New team boundary requiring independent release cadence
- New technology stack (e.g., ML/AI training pipeline)

## Template Checklist

### 1. Assign to a Layer
Every repo must belong to exactly one layer:
- **Design Layer**: Produces design artifacts (tokens, specs, maps)
- **Backend/Control Layer**: Produces API contracts (OpenAPI, Proto)
- **Experience Layer**: Consumes contracts and design artifacts

### 2. Create Repository with Standard Structure

For **Backend** repos:
```
new-repo/
  cmd/api-server/
  internal/domain/
  api/openapi/
  api/proto/
  tests/
  docs/adr/
  deploy/helm/
  .github/workflows/
  AGENTS.md
  governance/manifest.json
  Makefile
  README.md
```

For **Experience** repos:
```
new-repo/
  apps/<app-name>/
  packages/
  contracts/upstreams/
  compatibility/manifest.json
  governance/manifest.json
  docs/
  scripts/integration/
  .github/workflows/
  AGENTS.md
  turbo.json
  pnpm-workspace.yaml
  package.json
```

### 3. Update Ecosystem Docs
- [ ] Add to `ECOSYSTEM_REPO_CATALOG.md` with GitHub description
- [ ] Add to `ECOSYSTEM_FOLDER_TREE.md` with folder structure
- [ ] Add to `ECOSYSTEM_LAYER_MODEL.md` under correct layer
- [ ] Update `CONTRACT_OWNERSHIP.md` if it produces/consumes contracts
- [ ] Update `COMPATIBILITY_MATRIX.md` in consuming repos

### 4. Create Required Files
- [ ] `AGENTS.md` -- Codex operating instructions
- [ ] `governance/manifest.json` -- HOTL default mode
- [ ] `.github/workflows/ci.yml` -- PR/push quality checks
- [ ] `.github/workflows/integration.yml` -- Cross-repo validation
- [ ] `README.md` -- Setup and usage instructions

### 5. Wire Integration
- [ ] Add to upstream-sources.json in consuming repos
- [ ] Add to compatibility manifests
- [ ] Create sync scripts if it produces contracts
- [ ] Add to upstream-monitor.yml in consuming repos

### 6. Governance
- [ ] Set HOTL as default governance mode
- [ ] Add CODEOWNERS
- [ ] Configure branch protection
- [ ] Add to cross-repo release train
