#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE_FILE="${1:-$ROOT_DIR/../AI-Software-Factory/neuroforge-sdx/api/openapi/openapi.json}"
TARGET_FILE="$ROOT_DIR/contracts/upstreams/ai-software-factory/api/openapi/openapi.json"

mkdir -p "$(dirname "$TARGET_FILE")"
cp "$SOURCE_FILE" "$TARGET_FILE"

if [[ -f "$ROOT_DIR/../AI-Software-Factory/neuroforge-sdx/api/openapi/manifest.json" ]]; then
  cp "$ROOT_DIR/../AI-Software-Factory/neuroforge-sdx/api/openapi/manifest.json" "$ROOT_DIR/contracts/upstreams/ai-software-factory/api/openapi/manifest.json"
fi

echo "OpenAPI artifact synced to $TARGET_FILE"
