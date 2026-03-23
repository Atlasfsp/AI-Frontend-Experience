import { test, expect } from '@playwright/test';
import { mockLoginSoftwareFactory, waitForApp } from '../fixtures';

test.use({ baseURL: 'http://localhost:3000' });

test.describe('Software Factory — Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await mockLoginSoftwareFactory(page);
    await waitForApp(page);
  });

  test('sidebar renders with navigation items', async ({ page }) => {
    const nav = page.locator('nav, [role="navigation"]').first();
    await expect(nav).toBeVisible();
  });

  const routes = [
    { name: 'Dashboard', path: '/software-factory/dashboard' },
    { name: 'Builds', path: '/software-factory/builds' },
    { name: 'Work Items', path: '/software-factory/work-items' },
    { name: 'Agents', path: '/software-factory/agents' },
    { name: 'Workspaces', path: '/software-factory/workspaces' },
    { name: 'Compliance', path: '/software-factory/compliance' },
    { name: 'Settings', path: '/software-factory/settings' },
    { name: 'PRD Intake', path: '/software-factory/prd-intake' },
    { name: 'Architecture', path: '/software-factory/architecture' },
    { name: 'Domain Model', path: '/software-factory/domain-model' },
    { name: 'ADRs', path: '/software-factory/adrs' },
    { name: 'API Contracts', path: '/software-factory/api-contracts' },
    { name: 'Swagger', path: '/software-factory/swagger' },
    { name: 'Release Manager', path: '/software-factory/release-manager' },
    { name: 'Activity', path: '/software-factory/activity' },
  ];

  for (const route of routes) {
    test(`navigates to ${route.name} without errors`, async ({ page }) => {
      const response = await page.goto(route.path);

      // Page should not return a server error
      expect(response?.status()).toBeLessThan(500);

      // Page should render content (not crash to a blank page)
      await expect(page.locator('body')).not.toBeEmpty();

      // No uncaught errors should appear in the page
      const errorOverlay = page.locator('#__next-error, [data-nextjs-dialog]');
      await expect(errorOverlay).toHaveCount(0);
    });
  }
});
