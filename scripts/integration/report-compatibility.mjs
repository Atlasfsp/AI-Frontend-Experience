import path from 'node:path';

import { readJson } from './common.mjs';

const root = path.resolve(import.meta.dirname, '..', '..');
const compatibility = readJson(root, 'compatibility/manifest.json');
const consumedUpstreams = readJson(root, 'compatibility/consumed-upstreams.json');
const generatedClientManifest = readJson(root, 'packages/api-clients/contracts/generated-client.manifest.json');

console.log(
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      repo: compatibility.repo,
      repoVersion: compatibility.repoVersion,
      compatibleUpstreams: compatibility.compatibleUpstreams,
      consumedUpstreams,
      generatedClientManifest,
    },
    null,
    2,
  ),
);
