# Cross-Repo Standards

This repo consumes backend and design producer artifacts through explicit versioned manifests.

## Naming conventions

- Route ids use dotted domain names such as `software-factory.dashboard`.
- Screen ids use kebab case such as `software-factory-dashboard`.
- Client artifact ids use `<domain>-<kind>`.

## API error model

Consumers expect the normalized BAC error envelope:

- `code`
- `message`
- `status`
- `category`
- `requestId`
- `retryable`
- `details`

## Auth and session contract

- Authentik provides authentication.
- Session state carries tenant, workspace, role, permission, and expiry data.
- Backend enforcement remains authoritative.

## Tenant and workspace identity

- `tenantId` and `workspaceId` remain first-class identifiers in client models and route context.

## Pagination and filtering

- Cursor pagination and stable filter vocabulary are assumed by shared client abstractions.

## Observability event naming

- Frontend events use `bac.web.<domain>.<action>`.

## Design-token naming and export format

- Tokens remain JSON and must preserve `color`, `typography`, `spacing`, `radius`, `elevation`, and `components`.

## Route naming and screen ids

- Design handoff route ids and implementation paths must stay aligned.

## Release tagging conventions

- Upstream contracts and handoffs use artifact tags.
- This repo uses `repo/v<semver>` for application releases.

## Compatibility matrix rules

- All consumed upstream artifacts declare supported semver ranges.
- CI fails on unsupported versions or stale generated bindings.
