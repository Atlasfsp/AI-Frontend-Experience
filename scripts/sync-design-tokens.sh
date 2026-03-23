#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE_DIR="${1:-$ROOT_DIR/../Design-Factory_Figma/design-system/tokens}"
TARGET_DIR="$ROOT_DIR/packages/design-tokens/src/tokens"
SNAPSHOT_DIR="$ROOT_DIR/contracts/upstreams/design-factory-figma/design-system/tokens"

mkdir -p "$TARGET_DIR"
mkdir -p "$SNAPSHOT_DIR"

if [[ -f "$SOURCE_DIR/enterprise.json" ]]; then
  cp "$SOURCE_DIR/enterprise.json" "$TARGET_DIR/enterprise.json"
  cp "$SOURCE_DIR/enterprise.json" "$SNAPSHOT_DIR/enterprise.json"
fi

if [[ -f "$SOURCE_DIR/consumer.json" ]]; then
  cp "$SOURCE_DIR/consumer.json" "$TARGET_DIR/consumer.json"
  cp "$SOURCE_DIR/consumer.json" "$SNAPSHOT_DIR/consumer.json"
fi

if [[ -f "$SOURCE_DIR/manifest.json" ]]; then
  cp "$SOURCE_DIR/manifest.json" "$SNAPSHOT_DIR/manifest.json"
fi

echo "Design token sync complete. Source: $SOURCE_DIR"
