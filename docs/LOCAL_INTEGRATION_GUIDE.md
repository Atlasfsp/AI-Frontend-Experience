# BAC Ecosystem — Local Integration Guide

**Version:** 1.0.0
**Date:** 2026-03-23
**Status:** AUTHORITATIVE BASELINE

---

## Prerequisites

| Tool | Version | Required By | Install |
|------|---------|-------------|---------|
| Node.js | ≥ 20.10.0 | All experience repos | `nvm install 20` |
| pnpm | 9.15.9 | All experience repos | `corepack enable && corepack prepare pnpm@9.15.9` |
| Go | ≥ 1.22 | Backend repos only | `brew install go` |
| Docker | ≥ 24 | Container builds | Docker Desktop |
| buf | Latest | Proto compilation | `brew install bufbuild/buf/buf` |
| Expo CLI | ≥ 52 | Mobile development | `npx expo` (comes with Expo SDK) |
| EAS CLI | ≥ 12.6.2 | Mobile builds | `npm install -g eas-cli` |
| Maestro | Latest | Mobile E2E tests | `curl -Ls "https://get.maestro.mobile.dev" \| bash` |
| k6 | Latest | Load tests | `brew install k6` |

---

## Quick Start (Single Repo)

### Web Frontend
```bash
git clone https://github.com/stratogroup/AI-Frontend-Experience
cd AI-Frontend-Experience
pnpm install
pnpm dev
# software-factory-web → http://localhost:3000
# platform-automation-web → http://localhost:3001
# docs-portal → http://localhost:3002
```

### Mobile Companion
```bash
git clone https://github.com/stratogroup/AI-Companion-Mobile
cd AI-Companion-Mobile
pnpm install
pnpm dev
# Expo dev server → http://localhost:8081
# Open in Expo Go or press 'i' for iOS simulator
```

### Backend (Software Factory)
```bash
git clone https://github.com/stratogroup/AI-Software-Factory
cd AI-Software-Factory/neuroforge-sdx
make run-api
# API server → http://localhost:8080
```

---

## Mock Mode (Default — No Backend Needed)

Both experience repos default to mock mode. All API calls return synthetic data.

### Web
```bash
# .env.local (created automatically or manually)
NEXT_PUBLIC_BAC_ENABLE_MOCK_API=true    # default
NEXT_PUBLIC_BAC_ENV=development
NEXT_PUBLIC_BAC_REGION=ng
```

Mock login: Click "Continue with operator session" on the login page.

### Mobile
```bash
# Set via EAS profile or .env
EXPO_PUBLIC_BAC_ENABLE_MOCK_API=true    # default
EXPO_PUBLIC_BAC_ENV=development
EXPO_PUBLIC_BAC_DEFAULT_REGION=ng
```

Mock login: Select a role from the role picker on the login screen.

---

## Developing Against Local Backend

When you need to test against a real backend running locally:

### Terminal 1: Start backend
```bash
cd AI-Software-Factory/neuroforge-sdx
make run-api    # Starts on :8080
```

### Terminal 2: Start web frontend pointing to local backend
```bash
cd AI-Frontend-Experience
NEXT_PUBLIC_BAC_ENABLE_MOCK_API=false \
NEXT_PUBLIC_BAC_API_URL=http://localhost:8080 \
pnpm dev
```

### Terminal 3: Start mobile pointing to local backend
```bash
cd AI-Companion-Mobile
EXPO_PUBLIC_BAC_ENABLE_MOCK_API=false \
EXPO_PUBLIC_BAC_API_BASE_URL=http://localhost:8080 \
pnpm dev
```

---

## Contract Sync

Sync upstream contract artifacts from GitHub Releases:

```bash
# Web repo
cd AI-Frontend-Experience
pnpm contracts:generate       # Sync + regenerate clients
pnpm contracts:validate       # Verify no drift

# Mobile repo
cd AI-Companion-Mobile
pnpm contracts:generate       # Sync + regenerate clients
pnpm contracts:validate       # Verify no drift
```

### What Sync Does
1. `sync-upstreams.mjs` downloads latest contract artifacts from GitHub Release tags
2. Writes them to `contracts/upstreams/<producer>/`
3. `generate-client-bindings.mjs` parses OpenAPI JSON specs and generates typed TypeScript clients
4. Generated files go to `packages/api-clients/src/generated/` (web) or `packages/api-mobile-clients/src/generated/` (mobile)

### Validating After Sync
```bash
pnpm contracts:validate       # Compares generated code to committed code
pnpm design:validate          # Validates design token JSON against Zod schema
pnpm docs:validate            # Checks doc file completeness
```

---

## Design Token Sync

Sync design tokens from Design-Factory_Figma:

```bash
# Included in contracts:generate, or run separately:
pnpm sync:contracts           # Pulls all upstream artifacts including tokens
```

### Token Locations After Sync

**Web:**
- `contracts/upstreams/design-factory-figma/design-system/tokens/enterprise.json`
- `contracts/upstreams/design-factory-figma/design-system/tokens/consumer.json`
- Transformed by `packages/design-tokens/src/transform.ts` → CSS variables + Tailwind theme

**Mobile:**
- `contracts/upstreams/design-factory-figma/design-system/tokens/enterprise.json`
- `contracts/upstreams/design-factory-figma/design-system/tokens/consumer.json`
- Consumed by `packages/ui-mobile/src/tamagui.ts` → 4 Tamagui themes

---

## Full Quality Check

Run the complete quality gate locally before pushing:

```bash
# Web
cd AI-Frontend-Experience
pnpm check    # lint + typecheck + test + build

# Mobile
cd AI-Companion-Mobile
pnpm check    # lint + typecheck + test + build
```

---

## Running Tests

### Web
```bash
pnpm test                    # Unit tests (Vitest)
pnpm test:e2e                # Playwright E2E (requires apps running)
pnpm test:e2e:ui             # Playwright UI mode
```

### Mobile
```bash
pnpm test                    # Unit tests (Jest)
# Maestro E2E (requires simulator + dev build)
maestro test e2e/maestro/
```

---

## Storybook (Web Components)

```bash
cd AI-Frontend-Experience
pnpm --filter @bac/ui storybook    # Opens on http://localhost:6006
```

---

## Docker Build (Web)

Build individual apps as containers:

```bash
cd AI-Frontend-Experience

# Software Factory Web
docker build --build-arg APP_NAME=software-factory-web -t bac/software-factory-web .

# Platform Automation Web
docker build --build-arg APP_NAME=platform-automation-web -t bac/platform-automation-web .

# Docs Portal
docker build --build-arg APP_NAME=docs-portal -t bac/docs-portal .
```

### Staging Dry-Run (all 3 apps)
```bash
./scripts/staging-dry-run.sh
# Builds all 3, starts them, checks health endpoints, stops them
```

---

## Environment Variables Reference

### Web (.env.local)
```bash
NEXT_PUBLIC_BAC_ENV=development|staging|production
NEXT_PUBLIC_BAC_ENABLE_MOCK_API=true|false
NEXT_PUBLIC_BAC_API_URL=http://localhost:8080
NEXT_PUBLIC_BAC_REGION=ng|za|eu
NEXT_PUBLIC_SENTRY_DSN=                          # Optional
NEXT_PUBLIC_BAC_AUTH_URL=http://localhost:9000    # Authentik
NEXT_PUBLIC_BAC_AUTH_CLIENT_ID=bac-web
```

### Mobile (.env)
```bash
EXPO_PUBLIC_BAC_ENV=development|staging|production
EXPO_PUBLIC_BAC_ENABLE_MOCK_API=true|false
EXPO_PUBLIC_BAC_API_BASE_URL=http://localhost:8080
EXPO_PUBLIC_BAC_DEFAULT_REGION=ng|za|eu
EXPO_PUBLIC_BAC_SENTRY_DSN=                      # Optional
EXPO_PUBLIC_BAC_AUTH_URL=http://localhost:9000
EXPO_PUBLIC_BAC_AUTH_CLIENT_ID=bac-mobile
EXPO_PUBLIC_BAC_EAS_PROJECT_ID=                  # Required for EAS Build
```

---

## Troubleshooting

| Problem | Solution |
|---------|---------|
| `pnpm install` fails | Delete `node_modules` and `pnpm-lock.yaml`, run `pnpm install` again |
| Port already in use | Kill process: `lsof -ti:3000 \| xargs kill` |
| Contract drift detected | Run `pnpm contracts:generate` and commit the changes |
| Design token validation fails | Check `contracts/upstreams/design-factory-figma/design-system/tokens/` for valid JSON |
| Mock login doesn't work | Verify `NEXT_PUBLIC_BAC_ENABLE_MOCK_API=true` in `.env.local` |
| Mobile Expo error | Clear cache: `expo start --clear` |
| Docker build fails | Verify `APP_NAME` matches package name in `apps/*/package.json` |
