# Micro-Frontend Architecture Evaluation

## Context
As the BAC platform grows beyond the current 3 web apps, we need to evaluate whether micro-frontends offer benefits over the current monorepo multi-app approach.

## Current Architecture
- **Monorepo**: pnpm workspaces + Turborepo
- **3 apps**: software-factory-web, platform-automation-web, docs-portal
- **10 shared packages**: @bac/* namespace
- **Single Docker build**: Multi-stage Dockerfile with APP_NAME build arg

## Micro-Frontend Options Evaluated

### Option A: Module Federation (Webpack/Rspack)
**Pros:** Runtime composition, independent deploys, shared dependencies
**Cons:** Complex configuration, version skew risk, debugging difficulty
**Verdict:** Premature. Current monorepo handles 3 apps well.

### Option B: Single-SPA
**Pros:** Framework-agnostic, mature ecosystem
**Cons:** Heavy runtime, complex routing, over-engineered for our scale
**Verdict:** Not recommended. All apps use Next.js -- no need for framework agnosticism.

### Option C: Next.js Multi-Zones
**Pros:** Native Next.js support, simple URL-based routing, each zone deploys independently
**Cons:** No shared runtime state, cold navigation between zones
**Verdict:** Best option when we exceed 5 apps.

### Option D: Turborepo + Separate Deploys (Current)
**Pros:** Simple, proven, shared packages, single CI pipeline
**Cons:** All apps rebuild on shared package change
**Verdict:** Current approach. Works well up to ~5 apps.

## Decision Matrix

| Factor | Current (D) | Module Fed (A) | Multi-Zones (C) |
|--------|------------|----------------|-----------------|
| Complexity | Low | High | Medium |
| Independent deploy | Yes (Docker per app) | Yes | Yes |
| Shared packages | Yes (workspace) | Yes (shared) | Partial (npm) |
| Build speed | Good (Turbo cache) | Good | Good |
| Team independence | Good | Excellent | Excellent |
| Debugging | Easy | Hard | Medium |

## Recommendation
Stay with **Option D** (current monorepo) until we reach 5+ web applications. At that point, evaluate **Option C** (Next.js Multi-Zones) as the migration path.

### Trigger to Re-Evaluate
- More than 5 web applications in the monorepo
- Build times exceed 30 minutes despite remote caching
- Two or more teams blocked by shared package changes
- Need for different Next.js versions across apps

## Migration Path (When Needed)
1. Extract each app into a standalone Next.js project
2. Publish shared packages to private npm registry
3. Configure Multi-Zones in a root Next.js config
4. Set up URL-based routing between zones
5. Deploy each zone as independent container
