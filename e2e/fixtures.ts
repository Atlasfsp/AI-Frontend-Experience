import { type Page, expect } from '@playwright/test';

/**
 * Performs a mock login on the software-factory-web login page.
 * Fills the tenant/workspace fields and submits the mock session form.
 */
export async function mockLoginSoftwareFactory(
  page: Page,
  options?: { tenantId?: string; workspaceId?: string },
) {
  await page.goto('/login');
  await page.waitForSelector('h1');

  const tenantId = options?.tenantId ?? 'tenant-echo';
  const workspaceId = options?.workspaceId ?? 'workspace-core';

  await page.fill('#tenantId', tenantId);
  await page.fill('#workspaceId', workspaceId);
  await page.getByRole('button', { name: 'Continue with mock session' }).click();
}

/**
 * Performs a mock operator login on the platform-automation-web login page.
 * Clicks the operator session button to create a mock session.
 */
export async function mockLoginPlatformAutomation(page: Page) {
  await page.goto('/login');
  await page.waitForSelector('h1');
  await page.getByRole('button', { name: 'Continue with operator session' }).click();
}

/**
 * Waits for the app shell to be fully rendered by checking
 * for common layout elements (nav, main content area).
 */
export async function waitForApp(page: Page) {
  await expect(page.locator('body')).toBeVisible();
  // Wait for either a nav element or the main content to appear,
  // indicating the app shell has hydrated
  await page.waitForLoadState('networkidle');
  await expect(page.locator('main, [role="main"], nav, [role="navigation"]').first()).toBeVisible({
    timeout: 15_000,
  });
}
