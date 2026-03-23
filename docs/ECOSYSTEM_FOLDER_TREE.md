# BAC Ecosystem — Approved Folder Tree Baseline

**Version:** 1.0.0
**Date:** 2026-03-23
**Status:** IMMUTABLE BASELINE — Codex must not create files outside this structure without approval

---

## Complete 6-Repository Folder Tree

```
stratogroup-ai-ecosystem/
│
├── AI-Software-Factory/
│   └── neuroforge-sdx/
│       ├── cmd/
│       │   ├── api-server/
│       │   ├── worker/
│       │   └── cli/
│       ├── internal/
│       │   ├── domain/
│       │   ├── usecases/
│       │   ├── ports/
│       │   ├── adapters/
│       │   │   ├── http/
│       │   │   ├── grpc/
│       │   │   ├── messaging/
│       │   │   ├── persistence/
│       │   │   └── external/
│       │   ├── orchestrators/
│       │   ├── compliance/
│       │   ├── generation/
│       │   ├── verification/
│       │   └── shared/
│       ├── api/
│       │   ├── proto/
│       │   │   ├── sdx/v1/           # 13 service protos
│       │   │   └── neuroforge/sdx/v1/ # legacy wrapper
│       │   ├── openapi/              # OpenAPI 3.1 specs
│       │   └── schemas/
│       ├── gen/                       # Generated clients (Go, Python, TS)
│       ├── tools/
│       │   ├── compliance/
│       │   ├── generators/
│       │   ├── mocks/
│       │   └── scripts/
│       ├── tests/
│       │   ├── unit/
│       │   ├── integration/
│       │   ├── contract/
│       │   ├── performance/
│       │   └── security/
│       ├── docs/
│       │   ├── adr/
│       │   ├── domain/
│       │   ├── api/
│       │   ├── architecture/
│       │   ├── runbooks/
│       │   └── product/
│       ├── deploy/
│       │   ├── helm/
│       │   ├── kubevela/
│       │   ├── fleet/
│       │   ├── terraform/
│       │   └── docker/
│       ├── configs/
│       ├── examples/
│       ├── scripts/
│       ├── .github/workflows/
│       ├── Makefile
│       ├── factory.yaml
│       ├── README.md
│       └── LICENSE
│
├── AI-Platform-Automation/
│   ├── cmd/
│   │   ├── api-server/
│   │   ├── worker/
│   │   └── cli/
│   ├── internal/
│   │   ├── domain/
│   │   ├── usecases/
│   │   ├── ports/
│   │   ├── adapters/
│   │   │   ├── http/
│   │   │   ├── grpc/
│   │   │   ├── persistence/
│   │   │   ├── kubernetes/
│   │   │   ├── rancher/
│   │   │   ├── fleet/
│   │   │   ├── kcp/
│   │   │   ├── kratix/
│   │   │   ├── crossplane/
│   │   │   └── vela/
│   │   ├── tenancy/
│   │   ├── provisioning/
│   │   ├── policy/
│   │   ├── observability/
│   │   ├── security/
│   │   └── shared/
│   ├── platform/
│   │   ├── bootstrap/
│   │   ├── clusters/
│   │   ├── fleet/
│   │   ├── kcp/
│   │   ├── kratix/
│   │   ├── crossplane/
│   │   ├── vela/
│   │   ├── policies/
│   │   ├── observability/
│   │   ├── security/
│   │   └── runbooks/
│   ├── api/
│   │   ├── proto/
│   │   ├── openapi/
│   │   └── schemas/
│   ├── architecture/
│   │   ├── adr/
│   │   ├── docs/
│   │   └── *.md                      # Master architecture specs
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   ├── conformance/
│   │   ├── security/
│   │   └── disaster-recovery/
│   ├── docs/
│   │   ├── runbooks/
│   │   ├── tenancy/
│   │   ├── promises/
│   │   └── operations/
│   ├── scripts/
│   ├── .github/workflows/
│   ├── Makefile
│   ├── platform.yaml
│   ├── README.md
│   └── LICENSE
│
├── Design-Factory_Stitch/
│   ├── prompts/
│   │   ├── software-factory/
│   │   ├── platform-automation/
│   │   ├── shared-ui/
│   │   ├── mobile/
│   │   └── experiments/
│   ├── briefs/
│   │   ├── products/
│   │   ├── modules/
│   │   └── campaigns/
│   ├── outputs/
│   │   ├── exported-images/
│   │   ├── generated-layouts/
│   │   ├── screen-inventories/
│   │   └── archived-runs/
│   ├── governance/                    # 15 governance documents
│   ├── playbooks/                     # 4 execution workflows
│   ├── templates/                     # 27 reusable templates
│   ├── standards/
│   │   ├── naming/
│   │   ├── export-conventions/
│   │   ├── prompt-patterns/
│   │   └── quality-checklists/
│   ├── exports/
│   │   └── concept-inventory/
│   ├── handoffs/
│   │   └── exploratory-prompts/
│   ├── compatibility/
│   │   └── manifest.json
│   ├── docs/
│   ├── scripts/
│   ├── .github/workflows/
│   ├── README.md
│   └── LICENSE
│
├── Design-Factory_Figma/
│   ├── apps/
│   │   ├── api/
│   │   ├── orchestrator/
│   │   ├── reviewer/
│   │   ├── figma-writer-service/
│   │   └── figma-plugin/
│   ├── packages/
│   │   ├── contracts/                 # Zod schemas (token, route, spec)
│   │   ├── prompts/
│   │   ├── templates/
│   │   └── utils/
│   ├── design-system/
│   │   ├── tokens/
│   │   ├── components/
│   │   ├── patterns/
│   │   ├── layouts/
│   │   └── icons/
│   ├── handoff/
│   │   ├── route-maps/
│   │   ├── component-specs/
│   │   ├── state-maps/
│   │   ├── design-notes/
│   │   └── exports/
│   ├── data/
│   ├── compatibility/
│   │   └── manifest.json
│   ├── docs/
│   ├── templates/
│   ├── scripts/
│   ├── archives/
│   ├── .github/workflows/
│   ├── pnpm-workspace.yaml
│   ├── package.json
│   ├── README.md
│   └── LICENSE
│
├── AI-Frontend-Experience/
│   ├── apps/
│   │   ├── software-factory-web/
│   │   │   ├── app/                   # Next.js App Router
│   │   │   │   ├── (app)/            # Authenticated routes
│   │   │   │   ├── login/
│   │   │   │   └── api/              # BFF proxy routes
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   ├── providers/
│   │   │   ├── styles/
│   │   │   ├── public/
│   │   │   └── tests/
│   │   ├── platform-automation-web/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   ├── providers/
│   │   │   ├── styles/
│   │   │   ├── public/
│   │   │   └── tests/
│   │   └── docs-portal/
│   │       ├── app/
│   │       ├── components/
│   │       ├── content/
│   │       ├── lib/
│   │       ├── public/
│   │       └── tests/
│   ├── packages/
│   │   ├── ui/                        # 27 React components + Storybook
│   │   ├── design-tokens/             # Zod-validated token transform
│   │   ├── api-clients/               # Generated + mock API clients
│   │   │   └── src/generated/         # Codegen output
│   │   ├── auth/                      # OIDC + session + guards
│   │   ├── config/                    # Env + feature flags + regions
│   │   ├── observability/             # Sentry + OTel + logger
│   │   ├── domain-contracts/          # Shared Zod domain schemas
│   │   ├── i18n/                      # en/fr/pt translations
│   │   ├── testing/                   # Vitest + MSW helpers
│   │   ├── eslint-config/
│   │   └── tsconfig/
│   ├── contracts/
│   │   └── upstreams/
│   │       ├── ai-software-factory/
│   │       ├── ai-platform-automation/
│   │       ├── design-factory-figma/
│   │       └── design-factory-stitch/
│   ├── compatibility/
│   │   └── manifest.json
│   ├── e2e/                           # Playwright E2E tests
│   ├── deploy/
│   │   ├── staging/
│   │   └── canary/
│   ├── tests/load/                    # k6 load tests
│   ├── scripts/
│   │   └── integration/              # 10 sync/validate scripts
│   ├── docs/
│   ├── .github/workflows/            # 13 CI/CD workflows
│   ├── turbo.json
│   ├── Dockerfile
│   ├── package.json
│   ├── pnpm-workspace.yaml
│   ├── playwright.config.ts
│   ├── .releaserc.json
│   ├── README.md
│   └── LICENSE
│
└── AI-Companion-Mobile/
    ├── apps/
    │   └── operator-mobile/
    │       ├── app/                    # Expo Router file-based routes
    │       │   ├── _layout.tsx
    │       │   ├── (auth)/            # Login, biometric, session confirm
    │       │   ├── (tabs)/            # 5-tab navigation
    │       │   ├── alerts/
    │       │   ├── approvals/
    │       │   ├── incidents/
    │       │   ├── workspaces/
    │       │   ├── software-factory/
    │       │   ├── platform/
    │       │   ├── builds/
    │       │   ├── clusters/
    │       │   ├── work-items/
    │       │   ├── audit-log/
    │       │   ├── runbooks/
    │       │   └── settings/
    │       ├── src/
    │       │   ├── providers/
    │       │   └── lib/
    │       ├── assets/
    │       ├── app.config.ts
    │       ├── eas.json
    │       └── package.json
    ├── packages/
    │   ├── ui-mobile/                 # Tamagui + 14 components
    │   ├── api-mobile-clients/        # Generated + mock + offline queue
    │   │   └── src/generated/
    │   ├── auth-mobile/               # OIDC + biometric + 9 roles
    │   ├── config/                    # Env + feature flags + regions
    │   ├── observability/             # Sentry + metrics + logger
    │   ├── i18n-mobile/               # en/fr/pt translations
    │   └── testing/
    ├── contracts/
    │   └── upstreams/
    │       ├── ai-software-factory/
    │       ├── ai-platform-automation/
    │       ├── design-factory-figma/
    │       └── design-factory-stitch/
    ├── compatibility/
    │   └── manifest.json
    ├── e2e/maestro/                   # 12 Maestro E2E flows
    ├── scripts/
    │   └── integration/
    ├── docs/
    ├── .github/workflows/             # 6 CI/CD workflows
    ├── turbo.json
    ├── package.json
    ├── pnpm-workspace.yaml
    ├── .releaserc.json
    ├── README.md
    └── LICENSE
```

---

## Structural Rules

1. **New apps** go under `apps/` in the relevant experience repo.
2. **New shared packages** go under `packages/` with `@bac/` or `@bac-mobile/` namespace.
3. **New upstream contracts** go under `contracts/upstreams/<producer-name>/`.
4. **Generated code** goes under `src/generated/` within the consuming package.
5. **Integration scripts** go under `scripts/integration/`.
6. **E2E tests** go under `e2e/` at repo root.
7. **Deploy configs** go under `deploy/` at repo root.
8. **Architecture docs** go under `docs/` at repo root.
