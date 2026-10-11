# Governed Browser Adapter

`@bac/governed-browser` is the experience-layer safety kernel for a future
Page-Agent-compatible adapter. It does not embed Page Agent and it does not own
the backend execution contract.

The kernel treats model plans and page content as untrusted. It intersects each
tool choice with a server-supplied allowlist, blocks prompt-injection signals,
requires an Authentik/SpiceDB-derived tenant/actor/decision context, requires a
human confirmation receipt for mutations, enforces step/time budgets, exposes an
operator kill switch, and emits argument-free audit metadata. Raw model keys are
rejected; model access belongs behind the AICO/AI Gateway server-side port using
Vault/KMS references.

The capability is opt-in per tenant. Registered tools require accessible names;
navigation is restricted to the configured same-origin set; read-only tool
failures have a bounded retry policy; and mutations require tenant/tool-scoped
idempotency keys so replay returns the original result without re-execution.

Page Agent's free demo API is not an enterprise integration path. A later BFF
adapter must consume an authoritative backend contract, propagate OpenTelemetry
context, and submit consequential actions through the Platform Services governed
execution/approval API. HOTL remains the default governance mode.
