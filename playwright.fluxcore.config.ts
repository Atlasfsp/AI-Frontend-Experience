import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e/software-factory',
  testMatch: 'frontend-providers.spec.ts',
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3310' },
  webServer: {
    command: 'pnpm --dir apps/software-factory-web exec next start --port 3310 --hostname 127.0.0.1',
    url: 'http://localhost:3310/login',
    reuseExistingServer: false,
    timeout: 60000,
    env: { NEXT_TELEMETRY_DISABLED: '1' },
  },
});
