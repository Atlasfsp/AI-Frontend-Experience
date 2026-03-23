import path from 'node:path';

import { readJson, writeText } from './common.mjs';

const root = path.resolve(import.meta.dirname, '..', '..');
const consumedUpstreams = readJson(root, 'compatibility/consumed-upstreams.json');

const softwareFactoryManifest = readJson(root, 'contracts/upstreams/ai-software-factory/api/openapi/manifest.json');
const softwareFactoryOpenApi = readJson(root, 'contracts/upstreams/ai-software-factory/api/openapi/openapi.json');
const platformManifest = readJson(root, 'contracts/upstreams/ai-platform-automation/api/openapi/manifest.json');
const platformOpenApi = readJson(root, 'contracts/upstreams/ai-platform-automation/api/openapi/platform-automation-v1.openapi.json');
const generatedAt = new Date().toISOString();

const softwareFactoryContract = softwareFactoryManifest.artifacts.find(
  (artifact) => artifact.artifactId === 'software-factory-openapi',
);
const platformContract = platformManifest.artifacts.find(
  (artifact) => artifact.artifactId === 'platform-automation-openapi',
);
const softwareFactoryRelease = consumedUpstreams.selectedUpstreams.find(
  (upstream) => upstream.slug === 'ai-software-factory',
);
const platformRelease = consumedUpstreams.selectedUpstreams.find(
  (upstream) => upstream.slug === 'ai-platform-automation',
);

const softwareFactoryPaths = Object.keys(softwareFactoryOpenApi.paths ?? {}).sort();
const platformPaths = Object.keys(platformOpenApi.paths ?? {}).sort();

const ts = `export interface GeneratedContractBinding {
  readonly producerRepo: string;
  readonly artifactId: string;
  readonly version: string;
  readonly releaseTag: string | null;
  readonly endpointCount: number;
  readonly endpoints: readonly string[];
  readonly generatedAt: string;
}

export const softwareFactoryPaths = ${JSON.stringify(softwareFactoryPaths, null, 2)} as const;

export const platformAutomationPaths = ${JSON.stringify(platformPaths, null, 2)} as const;

export const generatedContractBindings: readonly GeneratedContractBinding[] = [
  {
    producerRepo: 'ai-software-factory',
    artifactId: '${softwareFactoryContract.artifactId}',
    version: '${softwareFactoryContract.version}',
    releaseTag: ${JSON.stringify(softwareFactoryRelease?.releaseTag ?? null)},
    endpointCount: softwareFactoryPaths.length,
    endpoints: softwareFactoryPaths,
    generatedAt: '${generatedAt}',
  },
  {
    producerRepo: 'ai-platform-automation',
    artifactId: '${platformContract.artifactId}',
    version: '${platformContract.version}',
    releaseTag: ${JSON.stringify(platformRelease?.releaseTag ?? null)},
    endpointCount: platformAutomationPaths.length,
    endpoints: platformAutomationPaths,
    generatedAt: '${generatedAt}',
  },
] as const;
`;

writeText(root, 'packages/api-clients/src/generated/contract-registry.ts', ts);

const manifest = {
  schemaVersion: '1.0.0',
  generatedAt,
  sourceMode: consumedUpstreams.sourceMode,
  packageName: '@bac/api-clients',
  packageVersion: '1.0.0',
  upstreamArtifacts: [
    {
      producerRepo: 'ai-software-factory',
      artifactId: softwareFactoryContract.artifactId,
      version: softwareFactoryContract.version,
      releaseTag: softwareFactoryRelease?.releaseTag ?? null,
      endpointCount: softwareFactoryPaths.length,
    },
    {
      producerRepo: 'ai-platform-automation',
      artifactId: platformContract.artifactId,
      version: platformContract.version,
      releaseTag: platformRelease?.releaseTag ?? null,
      endpointCount: platformPaths.length,
    },
  ],
};

writeText(
  root,
  'packages/api-clients/contracts/generated-client.manifest.json',
  `${JSON.stringify(manifest, null, 2)}\n`,
);

console.log('Generated web client bindings updated.');
