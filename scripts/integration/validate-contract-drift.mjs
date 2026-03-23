import fs from 'node:fs';
import path from 'node:path';

import { ensure, isSemver, readJson, satisfiesRange } from './common.mjs';

const root = path.resolve(import.meta.dirname, '..', '..');
const compatibility = readJson(root, 'compatibility/manifest.json');
const consumedUpstreams = readJson(root, 'compatibility/consumed-upstreams.json');
const generatedClientManifest = readJson(root, 'packages/api-clients/contracts/generated-client.manifest.json');

const observed = new Map();
for (const artifact of readJson(root, 'contracts/upstreams/ai-software-factory/api/openapi/manifest.json').artifacts) {
  observed.set(artifact.artifactId, artifact.version);
}
for (const artifact of readJson(root, 'contracts/upstreams/ai-software-factory/api/proto/manifest.json').artifacts) {
  observed.set(artifact.artifactId, artifact.version);
}
for (const artifact of readJson(root, 'contracts/upstreams/ai-platform-automation/api/openapi/manifest.json').artifacts) {
  observed.set(artifact.artifactId, artifact.version);
}
for (const artifact of readJson(root, 'contracts/upstreams/ai-platform-automation/api/proto/manifest.json').artifacts) {
  observed.set(artifact.artifactId, artifact.version);
}
for (const artifact of readJson(root, 'contracts/upstreams/design-factory-figma/handoff/route-maps/manifest.json').artifacts) {
  observed.set(artifact.artifactId, artifact.version);
}
for (const artifact of readJson(root, 'contracts/upstreams/design-factory-figma/handoff/component-specs/manifest.json').artifacts) {
  observed.set(artifact.artifactId, artifact.version);
}
for (const artifact of readJson(root, 'contracts/upstreams/design-factory-figma/design-system/tokens/manifest.json').artifacts) {
  observed.set(artifact.artifactId, artifact.version);
}
for (const artifact of readJson(root, 'contracts/upstreams/design-factory-stitch/exports/concept-inventory/manifest.json').artifacts) {
  observed.set(artifact.artifactId, artifact.version);
}
for (const artifact of readJson(root, 'contracts/upstreams/design-factory-stitch/handoffs/exploratory-prompts/manifest.json').artifacts) {
  observed.set(artifact.artifactId, artifact.version);
}

for (const requirement of compatibility.compatibleUpstreams) {
  const actual = observed.get(requirement.artifactId);
  ensure(actual, `Missing upstream snapshot for ${requirement.artifactId}`);
  ensure(isSemver(actual), `${requirement.artifactId} must be semver`);
  ensure(
    satisfiesRange(actual, requirement.supportedRange),
    `Unsupported upstream version for ${requirement.artifactId}: ${actual} does not satisfy ${requirement.supportedRange}`,
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
  'contracts/upstreams/design-factory-stitch/compatibility/manifest.json',
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

console.log('Frontend contract compatibility validation passed.');
