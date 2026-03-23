#!/usr/bin/env bash
set -euo pipefail
echo "=== BAC Frontend Staging Dry-Run ==="
echo "Building all 3 apps..."
docker compose -f deploy/staging/docker-compose.yml build
echo "Starting services..."
docker compose -f deploy/staging/docker-compose.yml up -d
echo "Waiting for health checks..."
sleep 10
for port in 3000 3001 3002; do
  status=$(curl -sf http://localhost:$port/api/health | jq -r '.status' 2>/dev/null || echo "FAIL")
  echo "  :$port → $status"
done
echo "Stopping services..."
docker compose -f deploy/staging/docker-compose.yml down
echo "=== Dry-run complete ==="
