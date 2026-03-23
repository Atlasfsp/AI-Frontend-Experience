import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@bac/api-clients': fileURLToPath(new URL('./packages/api-clients/src/index.ts', import.meta.url)),
      '@bac/auth': fileURLToPath(new URL('./packages/auth/src/index.ts', import.meta.url)),
      '@bac/config': fileURLToPath(new URL('./packages/config/src/index.ts', import.meta.url)),
      '@bac/i18n': fileURLToPath(new URL('./packages/i18n/src/index.ts', import.meta.url)),
      '@bac/design-tokens': fileURLToPath(new URL('./packages/design-tokens/src/index.ts', import.meta.url)),
      '@bac/observability': fileURLToPath(new URL('./packages/observability/src/index.ts', import.meta.url)),
      '@bac/testing': fileURLToPath(new URL('./packages/testing/src/index.tsx', import.meta.url)),
      '@bac/ui': fileURLToPath(new URL('./packages/ui/src/index.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [fileURLToPath(new URL('./vitest.setup.ts', import.meta.url))],
  },
});
