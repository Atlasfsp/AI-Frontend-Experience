import { test, expect } from '@playwright/test';
import { mockLoginPlatformAutomation } from '../fixtures';

test.describe('HOTL governance integration', () => {
  test.beforeEach(async ({ page }) => {
    await mockLoginPlatformAutomation(page);
    await page.waitForURL(/\/platform/);
  });

  test('default governance mode is visible in the operator shell', async ({ page }) => {
    await page.goto('/platform/dashboard');
    await expect(page.getByLabel('Governance mode: HOTL')).toBeVisible();
  });
});
