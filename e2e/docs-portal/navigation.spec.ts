import { test, expect } from '@playwright/test';
import { waitForApp } from '../fixtures';

test.use({ baseURL: 'http://localhost:3002' });

test.describe('Docs Portal — Navigation', () => {
  test('docs home page renders', async ({ page }) => {
    const response = await page.goto('/');

    expect(response?.status()).toBeLessThan(500);
    await waitForApp(page);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  const routes = [
    { name: 'Getting Started', path: '/getting-started' },
    { name: 'Architecture', path: '/architecture' },
    { name: 'API Reference', path: '/api-reference' },
    { name: 'ADRs', path: '/adrs' },
    { name: 'Software Factory', path: '/software-factory' },
    { name: 'Platform', path: '/platform' },
    { name: 'Runbooks', path: '/runbooks' },
    { name: 'Search', path: '/search' },
    { name: 'Help', path: '/help' },
  ];

  for (const route of routes) {
    test(`navigates to ${route.name} without errors`, async ({ page }) => {
      const response = await page.goto(route.path);

      // Page should not return a server error
      expect(response?.status()).toBeLessThan(500);

      // Page should render content
      await expect(page.locator('body')).not.toBeEmpty();

      // No uncaught errors should appear in the page
      const errorOverlay = page.locator('#__next-error, [data-nextjs-dialog]');
      await expect(errorOverlay).toHaveCount(0);
    });
  }
});
