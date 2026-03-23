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

console.log('Frontend integration docs validated.');
