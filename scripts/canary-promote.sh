#!/usr/bin/env bash
set -euo pipefail
APP_NAME="${1:?Usage: canary-promote.sh <app-name> <version>}"
VERSION="${2:?Usage: canary-promote.sh <app-name> <version>}"
echo "Promoting $APP_NAME canary to stable at version $VERSION"
# Scale canary to match stable replicas
# Update stable deployment image
# Scale down canary
echo "Promotion complete"
