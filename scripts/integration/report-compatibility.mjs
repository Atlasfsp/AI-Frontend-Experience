import fs from 'node:fs';
import path from 'node:path';

import { readJson, satisfiesRange } from './common.mjs';

const root = path.resolve(import.meta.dirname, '..', '..');
const compatibility = readJson(root, 'compatibility/manifest.json');
const consumedUpstreams = readJson(root, 'compatibility/consumed-upstreams.json');
const generatedClientManifest = readJson(root, 'packages/api-clients/contracts/generated-client.manifest.json');

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

const selectedByRepo = new Map(consumedUpstreams.selectedUpstreams.map((entry) => [entry.slug, entry]));
const generatedBindings = new Map(generatedClientManifest.upstreamArtifacts.map((entry) => [entry.artifactId, entry]));
const upstreams = compatibility.compatibleUpstreams.map((requirement) => {
  const actualVersion = observed.get(requirement.artifactId) ?? null;
  const selectedUpstream = selectedByRepo.get(requirement.repo);
  const generatedBinding = generatedBindings.get(requirement.artifactId) ?? null;
  const compatible = actualVersion ? satisfiesRange(actualVersion, requirement.supportedRange) : false;
  const driftDetected = actualVersion !== requirement.pinnedVersion;
  let reason = null;
  if (!actualVersion) {
    reason = 'missing-upstream-snapshot';
  } else if (!compatible) {
    reason = `version ${actualVersion} is outside ${requirement.supportedRange}`;
  } else if (driftDetected) {
    reason = `pinned ${requirement.pinnedVersion} does not match observed ${actualVersion}`;
  }

  return {
    repo: requirement.repo,
    artifactId: requirement.artifactId,
    supportedRange: requirement.supportedRange,
    pinnedVersion: requirement.pinnedVersion,
    actualVersion,
    lastValidatedAt: requirement.lastValidatedAt,
    compatible,
    driftDetected,
    rejectionReason: reason,
    selectedReleaseTag: selectedUpstream?.releaseTag ?? null,
    sourceMode: selectedUpstream?.sourceMode ?? consumedUpstreams.sourceMode,
    generatedClientVersion: generatedBinding?.version ?? null
  };
});

const overallStatus = upstreams.every((entry) => entry.compatible && !entry.driftDetected)
  ? 'COMPATIBLE'
  : upstreams.some((entry) => !entry.compatible)
    ? 'INCOMPATIBLE'
    : 'DRIFT_DETECTED';

console.log(
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      repo: compatibility.repo,
      version: compatibility.repoVersion,
      validatedAt: compatibility.validatedAt,
      upstreams,
      overallStatus,
      consumedUpstreams,
      generatedClientManifest
    },
    null,
    2,
  ),
);
