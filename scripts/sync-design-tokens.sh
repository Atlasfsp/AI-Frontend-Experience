#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE_DIR="${1:-$ROOT_DIR/../Design-Factory_Figma/data/tokens}"
TARGET_DIR="$ROOT_DIR/packages/design-tokens/src/tokens"

mkdir -p "$TARGET_DIR"

if [[ -f "$SOURCE_DIR/enterprise.json" ]]; then
  cp "$SOURCE_DIR/enterprise.json" "$TARGET_DIR/enterprise.json"
fi

if [[ -f "$SOURCE_DIR/consumer.json" ]]; then
  cp "$SOURCE_DIR/consumer.json" "$TARGET_DIR/consumer.json"
fi

echo "Design token sync complete. Source: $SOURCE_DIR"
