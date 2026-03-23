#!/usr/bin/env node
/**
 * Cross-repo release train coordinator.
 * Validates that all upstream contracts are current before allowing release.
 */
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync('compatibility/manifest.json', 'utf8'));
const governanceManifest = JSON.parse(readFileSync('governance/manifest.json', 'utf8'));

console.log('=== Release Train Validation ===');

let canRelease = true;

// Check 1: Governance mode
if (governanceManifest.activeMode !== 'HOTL') {
  console.log('  \u2717 Governance mode must be HOTL for production release');
  canRelease = false;
} else {
  console.log('  \u2713 Governance mode: HOTL');
}

// Check 2: All upstreams pinned
for (const upstream of manifest.compatibleUpstreams) {
  if (!upstream.pinnedVersion) {
    console.log(`  \u2717 ${upstream.repo}/${upstream.artifactId}: not pinned`);
    canRelease = false;
  } else {
    console.log(`  \u2713 ${upstream.repo}/${upstream.artifactId}: ${upstream.pinnedVersion}`);
  }
}

// Check 3: Validation timestamp is recent (< 24h)
const validatedAt = new Date(manifest.validatedAt);
const hoursAgo = (Date.now() - validatedAt.getTime()) / (1000 * 60 * 60);
if (hoursAgo > 24) {
  console.log(`  \u2717 Compatibility last validated ${Math.round(hoursAgo)}h ago (max 24h)`);
  canRelease = false;
} else {
  console.log(`  \u2713 Compatibility validated ${Math.round(hoursAgo)}h ago`);
}

console.log(`\nRelease status: ${canRelease ? '\u2713 READY' : '\u2717 BLOCKED'}`);
if (!canRelease) process.exit(1);
