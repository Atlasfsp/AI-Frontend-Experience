import { defineConfig, devices } from '@playwright/test';

// Real Chromium browser, local-only static fixture, no preview/deployment.
export default defineConfig({
  testDir: './e2e/software-factory',
  testMatch: 'release0-write-fence.spec.ts',
  workers: 1,
  retries: 0,
  forbidOnly: true,
  reporter: 'list',
  use: { ...devices['Desktop Chrome'], headless: true },
});
