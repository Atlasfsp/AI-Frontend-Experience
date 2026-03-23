#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE_DIR="${1:-$ROOT_DIR/../AI-Software-Factory/neuroforge-sdx/gen/typescript/sdx}"
TARGET_DIR="$ROOT_DIR/packages/api-clients/src/generated/sdx"

rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR"
cp -R "$SOURCE_DIR"/. "$TARGET_DIR"/

echo "SDX proto types synced from $SOURCE_DIR"
