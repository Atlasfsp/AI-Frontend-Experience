# Governance Mode

Default declared mode for `AI-Frontend-Experience` is **HOTL**.

- Shared baseline: `../GOVERNANCE_MODE.md`
- Canonical package reference: `../Claude-Master-Architecture-Package/docs/GOVERNANCE_MODE.md`
- Repo-local switch: `governance/manifest.json`

## What changes by mode

| Mode | Repo behavior |
|------|---------------|
| HOTL | Web delivery proceeds automatically inside approved UI, auth, and release guardrails with human supervision by exception. |
| HITL | Human review is required at more explicit checkpoints before risky route, explorer, contract-consumption, or release changes move forward. |
| FULL_AUTONOMY | Automation may advance further inside approved boundaries, but generated-client validation, design-handoff validation, compatibility checks, and release docs still gate release. |

## Actions affected by governance mode

- generated client regeneration
- backend-for-frontend execution seams
- release promotion
- operator flow automation
- Swagger/OpenAPI explorer consumption workflows

## Unchanged in every mode

- `AI-Frontend-Experience` does not own backend contracts
- `AI-Frontend-Experience` does not own canonical design handoff
- design handoff validation remains mandatory
- compatibility validation remains mandatory

## Cannot be bypassed even in FULL_AUTONOMY

- policy and auth guard checks
- generated client validation
- design handoff validation
- compatibility validation
- release documentation updates

## Safe switching

1. Update `governance/manifest.json`
2. Update this file in the same PR
3. Run `pnpm governance:validate`
4. Keep HOTL as the default even if `activeMode` changes temporarily
