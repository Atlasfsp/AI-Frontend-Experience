import { test, expect } from '@playwright/test';
import { mockLoginPlatformAutomation, waitForApp } from '../fixtures';

test.use({ baseURL: 'http://localhost:3001' });

test.describe('Platform Automation — Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await mockLoginPlatformAutomation(page);
    await waitForApp(page);
  });

  const routes = [
    { name: 'Dashboard', path: '/platform/dashboard' },
    { name: 'Clusters', path: '/platform/clusters' },
    { name: 'Regions', path: '/platform/regions' },
    { name: 'Promises', path: '/platform/promises' },
    { name: 'Incidents', path: '/platform/incidents' },
    { name: 'Observability', path: '/platform/observability' },
    { name: 'GitOps', path: '/platform/gitops' },
    { name: 'Policy', path: '/platform/policy' },
    { name: 'Quotas', path: '/platform/quotas' },
    { name: 'Workspaces', path: '/platform/workspaces' },
    { name: 'Workspace Factory', path: '/platform/workspace-factory' },
    { name: 'Identity', path: '/platform/identity' },
    { name: 'Runbooks', path: '/platform/runbooks' },
    { name: 'GraphQL Explorer', path: '/platform/graphql-explorer' },
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
