#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE_FILE="${1:-$ROOT_DIR/../AI-Software-Factory/neuroforge-sdx/api/openapi/openapi.json}"
TARGET_FILE="$ROOT_DIR/packages/api-clients/contracts/sdx-openapi.json"

mkdir -p "$(dirname "$TARGET_FILE")"
cp "$SOURCE_FILE" "$TARGET_FILE"

echo "OpenAPI artifact synced to $TARGET_FILE"
