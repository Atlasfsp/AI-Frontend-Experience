import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..', '..');
const required = [
  '.env.integration.example',
  'compatibility/manifest.json',
  'compatibility/consumed-upstreams.json',
  'contracts/upstream-sources.json',
  'packages/api-clients/contracts/generated-client.manifest.json',
  'packages/api-clients/src/generated/contract-registry.ts',
];

for (const relativePath of required) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    throw new Error(`Missing release artifact prerequisite: ${relativePath}`);
  }
}

console.log('Frontend release artifacts validated.');
