#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== BAC Upstream Sync ==="
echo ""

# 1. Sync all upstream artifacts (design tokens, proto types, openapi specs)
echo "[1/3] Syncing upstream artifacts..."
node "$ROOT_DIR/scripts/integration/sync-upstreams.mjs"
echo "  Done."
echo ""

# 2. Validate design token drift
echo "[2/3] Validating design token drift..."
node "$ROOT_DIR/scripts/integration/validate-design-drift.mjs"
echo "  Done."
echo ""

# 3. Validate API contract drift
echo "[3/3] Validating contract drift..."
node "$ROOT_DIR/scripts/integration/validate-contract-drift.mjs"
echo "  Done."
echo ""

echo "=== Sync complete ==="
echo "  - Design tokens synced and validated"
echo "  - Proto types synced"
echo "  - OpenAPI specs synced and validated"
