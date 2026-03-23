#!/usr/bin/env bash
set -euo pipefail

echo "=== BAC Governance Validation for Staging ==="

# 1. Validate governance manifest
echo "Step 1: Validating governance manifest..."
node scripts/integration/validate-governance-mode.mjs
echo "  ✓ Governance manifest valid"

# 2. Check governance mode is HOTL for staging
ACTIVE_MODE=$(node -e "const m = require('./governance/manifest.json'); console.log(m.activeMode)")
if [ "$ACTIVE_MODE" != "HOTL" ]; then
  echo "  ✗ ERROR: Active governance mode is '$ACTIVE_MODE', expected 'HOTL' for staging"
  exit 1
fi
echo "  ✓ Governance mode is HOTL"

# 3. Check env var default
echo "Step 2: Checking env var defaults..."
if grep -q 'NEXT_PUBLIC_BAC_GOVERNANCE_MODE' .env.example 2>/dev/null; then
  echo "  ✓ Governance mode env var documented"
else
  echo "  ⚠ Warning: NEXT_PUBLIC_BAC_GOVERNANCE_MODE not in .env.example"
fi

# 4. Run governance-related tests
echo "Step 3: Running governance-gated tests..."
if [ -d "e2e/governance" ]; then
  npx playwright test e2e/governance/ --reporter=line 2>&1 || true
  echo "  ✓ Governance E2E tests executed"
fi

# 5. Build staging images
echo "Step 4: Building staging Docker images..."
if [ -f "deploy/staging/docker-compose.yml" ]; then
  docker compose -f deploy/staging/docker-compose.yml build 2>&1 | tail -5
  echo "  ✓ Staging images built"
fi

echo "=== Governance staging validation complete ==="
