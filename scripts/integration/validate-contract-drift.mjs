import fs from 'node:fs';
import path from 'node:path';

import { ensure, isIsoDate, isSemver, readJson, satisfiesRange } from './common.mjs';

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

ensure(isIsoDate(compatibility.validatedAt), 'compatibility.validatedAt must be ISO-8601');

for (const requirement of compatibility.compatibleUpstreams) {
  ensure(isSemver(requirement.pinnedVersion), `${requirement.artifactId} pinnedVersion must be semver`);
  ensure(isIsoDate(requirement.lastValidatedAt), `${requirement.artifactId} lastValidatedAt must be ISO-8601`);

  const actual = observed.get(requirement.artifactId);
  ensure(actual, `Missing upstream snapshot for ${requirement.artifactId}`);
  ensure(isSemver(actual), `${requirement.artifactId} must be semver`);
  ensure(
    satisfiesRange(actual, requirement.supportedRange),
    `Unsupported upstream version for ${requirement.artifactId}: ${actual} does not satisfy ${requirement.supportedRange}`,
  );
  ensure(
    actual === requirement.pinnedVersion,
    `Pinned compatibility drift for ${requirement.artifactId}: expected ${requirement.pinnedVersion}, received ${actual}`,
  );
}

for (const selected of consumedUpstreams.selectedUpstreams) {
  if (consumedUpstreams.sourceMode === 'github-release') {
    ensure(selected.releaseTag, `Missing consumed release tag for ${selected.slug}`);
  }
}

for (const producerManifestPath of [
  'contracts/upstreams/ai-software-factory/compatibility/manifest.json',
  'contracts/upstreams/ai-platform-automation/compatibility/manifest.json',
  'contracts/upstreams/design-factory-figma/compatibility/manifest.json',
  'contracts/upstreams/design-factory-stitch/compatibility/manifest.json'
]) {
  const producerCompatibility = readJson(root, producerManifestPath);
  const consumerRule = (producerCompatibility.compatibleConsumers ?? []).find(
    (consumer) => consumer.repo === compatibility.repo,
  );
  ensure(consumerRule, `Producer compatibility manifest missing consumer entry: ${producerManifestPath}`);
  ensure(
    satisfiesRange(compatibility.repoVersion, consumerRule.supportedRange),
    `Consumer version ${compatibility.repoVersion} is not supported by ${producerCompatibility.repo}`,
  );
}

for (const binding of generatedClientManifest.upstreamArtifacts) {
  const actual = observed.get(binding.artifactId);
  ensure(actual === binding.version, `Generated client manifest drift for ${binding.artifactId}`);
}

ensure(
  fs.existsSync(path.join(root, 'packages/api-clients/src/generated/contract-registry.ts')),
  'Missing generated contract registry',
);
ensure(
  fs.existsSync(path.join(root, 'contracts/upstreams/ai-software-factory/gen/typescript/sdx')),
  'Missing Software Factory Connect-ES snapshot',
);
ensure(
  fs.existsSync(path.join(root, 'packages/api-clients/src/generated/sdx')),
  'Missing synced Software Factory Connect-ES output',
);

console.log('Frontend contract compatibility validation passed.');
