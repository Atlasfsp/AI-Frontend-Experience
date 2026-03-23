import { rm } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const targets = [
  '.turbo',
  'coverage',
  'playwright-report',
  'test-results',
  'apps/software-factory-web/.next',
  'apps/platform-automation-web/.next',
  'apps/docs-portal/.next',
  'packages/ui/dist',
  'packages/design-tokens/dist',
  'packages/api-clients/dist',
  'packages/auth/dist',
  'packages/config/dist',
  'packages/observability/dist',
  'packages/testing/dist',
];

await Promise.all(
  targets.map((target) =>
    rm(join(root, target), {
      recursive: true,
      force: true,
    }),
  ),
);
