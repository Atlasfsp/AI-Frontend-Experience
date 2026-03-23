import { test, expect } from '@playwright/test';
import { mockLoginSoftwareFactory, waitForApp } from '../fixtures';

test.use({ baseURL: 'http://localhost:3000' });

test.describe('Software Factory — API Explorer', () => {
  test.beforeEach(async ({ page }) => {
    await mockLoginSoftwareFactory(page);
    await waitForApp(page);
  });

  test('/api-explorer page renders', async ({ page }) => {
    const response = await page.goto('/api-explorer');

    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('/api-explorer/sdx page renders Swagger-like content', async ({ page }) => {
    const response = await page.goto('/api-explorer/sdx');

    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).not.toBeEmpty();

    // Should contain API documentation content (Swagger/OpenAPI UI elements)
    const pageContent = page.locator('main, [role="main"], .swagger-ui, [data-testid]').first();
    await expect(pageContent).toBeVisible({ timeout: 10_000 });
  });
});
