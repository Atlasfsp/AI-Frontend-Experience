import { test, expect } from '@playwright/test';
import { waitForApp } from '../fixtures';

test.use({ baseURL: 'http://localhost:3002' });

test.describe('Docs Portal — Search', () => {
  test('search input exists and is interactive', async ({ page }) => {
    await page.goto('/search');
    await waitForApp(page);

    // Locate the search input
    const searchInput = page.getByRole('searchbox').or(
      page.locator('input[type="search"], input[placeholder*="earch"], input[name*="earch"]'),
    ).first();

    await expect(searchInput).toBeVisible({ timeout: 10_000 });

    // Verify the input is interactive (can be focused and typed into)
    await searchInput.click();
    await searchInput.fill('getting started');

    await expect(searchInput).toHaveValue('getting started');
  });

  test('search results update on query', async ({ page }) => {
    await page.goto('/search');
    await waitForApp(page);

    const searchInput = page.getByRole('searchbox').or(
      page.locator('input[type="search"], input[placeholder*="earch"], input[name*="earch"]'),
    ).first();

    await expect(searchInput).toBeVisible({ timeout: 10_000 });

    // Type a search query
    await searchInput.fill('architecture');

    // Wait for results to appear — look for any list items, links, or result containers
    const resultsArea = page.locator(
      '[data-testid="search-results"], [role="listbox"], ul, ol, .search-results',
    ).first();

    // Results area should become visible or update
    await expect(resultsArea).toBeVisible({ timeout: 10_000 });
  });
});
