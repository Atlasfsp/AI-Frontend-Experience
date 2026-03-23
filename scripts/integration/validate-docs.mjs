import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..', '..');
const docs = [
  'docs/CROSS_REPO_STANDARDS.md',
  'docs/INTEGRATION_ARCHITECTURE.md',
  'docs/CONTRACT_OWNERSHIP.md',
  'docs/CLIENT_GENERATION.md',
  'docs/COMPATIBILITY_MATRIX.md',
  'docs/CROSS_REPO_RELEASE_FLOW.md',
  'docs/LOCAL_INTEGRATION_GUIDE.md',
  'docs/GOVERNANCE_MODE.md',
];

for (const docPath of docs) {
  const fullPath = path.join(root, docPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing integration doc: ${docPath}`);
  }
  if (fs.readFileSync(fullPath, 'utf8').trim().length === 0) {
    throw new Error(`Integration doc is empty: ${docPath}`);
  }
}

const baselineRefs = [
  'ECOSYSTEM_REPO_CATALOG.md',
  'ECOSYSTEM_LAYER_MODEL.md',
  'ECOSYSTEM_FOLDER_TREE.md',
  'CONTRACT_OWNERSHIP.md',
  'COMPATIBILITY_MATRIX.md',
  'CROSS_REPO_RELEASE_FLOW.md',
  'LOCAL_INTEGRATION_GUIDE.md',
  'GOVERNANCE_MODE.md',
  'Claude-Master-Architecture-Package',
];
const integrationArchitecture = fs.readFileSync(path.join(root, 'docs/INTEGRATION_ARCHITECTURE.md'), 'utf8');
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
for (const ref of baselineRefs) {
  if (!integrationArchitecture.includes(ref)) {
    throw new Error(`Integration architecture doc must reference ${ref}`);
  }
  if (!readme.includes(ref)) {
    throw new Error(`README must reference ${ref}`);
  }
}

if (!fs.existsSync(path.join(root, 'governance/manifest.json'))) {
  throw new Error('Missing governance manifest: governance/manifest.json');
}

console.log('Frontend integration docs validated.');
