import fs from 'node:fs';
import path from 'node:path';

import { isIsoDate, readJson, satisfiesRange, writeJson } from './common.mjs';

const root = path.resolve(import.meta.dirname, '..', '..');
const compatibility = readJson(root, 'compatibility/manifest.json');

function readManifestArtifacts(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    return [];
  }
  return readJson(root, relativePath).artifacts ?? [];
}

const observed = new Map();
for (const relativePath of [
  'contracts/upstreams/ai-software-factory/api/openapi/manifest.json',
  'contracts/upstreams/ai-software-factory/api/proto/manifest.json',
  'contracts/upstreams/ai-platform-automation/api/openapi/manifest.json',
  'contracts/upstreams/ai-platform-automation/api/proto/manifest.json',
  'contracts/upstreams/design-factory-figma/handoff/route-maps/manifest.json',
  'contracts/upstreams/design-factory-figma/handoff/component-specs/manifest.json',
  'contracts/upstreams/design-factory-figma/handoff/state-maps/manifest.json',
  'contracts/upstreams/design-factory-figma/design-system/tokens/manifest.json',
  'contracts/upstreams/design-factory-stitch/handoffs/screen-maps/manifest.json'
]) {
  for (const artifact of readManifestArtifacts(relativePath)) {
    observed.set(artifact.artifactId, artifact.version);
  }
}

const now = new Date().toISOString();
if (!isIsoDate(now)) {
  throw new Error('Failed to compute compatibility validation timestamp');
}

const incompatible = [];
compatibility.compatibleUpstreams = compatibility.compatibleUpstreams.map((requirement) => {
  const actualVersion = observed.get(requirement.artifactId);
  if (!actualVersion || !satisfiesRange(actualVersion, requirement.supportedRange)) {
    incompatible.push({
      artifactId: requirement.artifactId,
      supportedRange: requirement.supportedRange,
      actualVersion: actualVersion ?? null
    });
    return requirement;
  }

  return {
    ...requirement,
    pinnedVersion: actualVersion,
    lastValidatedAt: now
  };
});

compatibility.validatedAt = now;
writeJson(root, 'compatibility/manifest.json', compatibility);
writeJson(root, 'reports/compatibility-refresh-report.json', {
  generatedAt: now,
  repo: compatibility.repo,
  incompatible
});

if (incompatible.length > 0) {
  throw new Error(
    `Incompatible upstream versions detected while refreshing compatibility manifest:\n- ${incompatible
      .map((entry) => `${entry.artifactId}: ${entry.actualVersion ?? 'missing'} not in ${entry.supportedRange}`)
      .join('\n- ')}`,
  );
}

console.log('Frontend compatibility manifest refreshed.');
