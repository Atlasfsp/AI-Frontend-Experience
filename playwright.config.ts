import { defineConfig, devices } from '@playwright/test';

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
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3000' },
    },
    {
      name: 'platform-automation',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3001' },
    },
    {
      name: 'docs-portal',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3002' },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter @bac/software-factory-web dev',
      port: 3000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter @bac/platform-automation-web dev',
      port: 3001,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter @bac/docs-portal dev',
      port: 3002,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
