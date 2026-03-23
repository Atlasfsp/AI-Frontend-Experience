#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE_DIR="${1:-$ROOT_DIR/../AI-Software-Factory/neuroforge-sdx/gen/typescript/sdx}"
TARGET_DIR="$ROOT_DIR/packages/api-clients/src/generated/sdx"
MANIFEST_TARGET="$ROOT_DIR/contracts/upstreams/ai-software-factory/api/proto/manifest.json"

rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR"
cp -R "$SOURCE_DIR"/. "$TARGET_DIR"/

mkdir -p "$(dirname "$MANIFEST_TARGET")"
if [[ -f "$ROOT_DIR/../AI-Software-Factory/neuroforge-sdx/api/proto/manifest.json" ]]; then
  cp "$ROOT_DIR/../AI-Software-Factory/neuroforge-sdx/api/proto/manifest.json" "$MANIFEST_TARGET"
fi

echo "SDX proto types synced from $SOURCE_DIR"
