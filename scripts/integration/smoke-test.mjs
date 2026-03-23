import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..', '..');
const criticalPages = [
  'apps/software-factory-web/app/(app)/software-factory/swagger/page.tsx',
  'apps/software-factory-web/app/(app)/software-factory/builds/[buildId]/page.tsx',
  'apps/platform-automation-web/app/(app)/platform/graphql-explorer/page.tsx',
  'apps/platform-automation-web/app/(app)/platform/workspaces/page.tsx',
  'apps/docs-portal/app/search/page.tsx',
];

for (const pagePath of criticalPages) {
  if (!fs.existsSync(path.join(root, pagePath))) {
    throw new Error(`Missing critical smoke-test route: ${pagePath}`);
  }
}

console.log('Frontend smoke-test assumptions validated.');
