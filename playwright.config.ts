import { defineConfig, devices } from '@playwright/test';

const serverScript = process.env.CI ? 'start' : 'dev';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'software-factory',
      testMatch: '**/software-factory/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3000' },
    },
    {
      name: 'platform-automation',
      testMatch: [
        '**/platform-automation/**/*.spec.ts',
        '**/governance/**/*.spec.ts',
      ],
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3001' },
    },
    {
      name: 'docs-portal',
      testMatch: '**/docs-portal/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3002' },
    },
  ],
  webServer: [
    {
      command: `pnpm --filter @bac/software-factory-web ${serverScript}`,
      port: 3000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm --filter @bac/platform-automation-web ${serverScript}`,
      port: 3001,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm --filter @bac/docs-portal ${serverScript}`,
      port: 3002,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
