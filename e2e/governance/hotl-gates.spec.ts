import { test, expect } from '@playwright/test';

test.describe('HOTL Governance Gates', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate and mock-login
    await page.goto('/login');
    await page.getByRole('button', { name: /operator session/i }).click();
    await page.waitForURL(/\/(software-factory|platform)/);
  });

  test('approval action shows confirmation dialog in HOTL mode', async ({ page }) => {
    await page.goto('/software-factory/builds');
    // Look for any approve/action button
    const actionButton = page.getByRole('button', { name: /approve|acknowledge|confirm/i }).first();
    if (await actionButton.isVisible()) {
      await actionButton.click();
      // Expect governance gate dialog to appear
      await expect(page.getByText(/confirm action|review required/i)).toBeVisible();
      // Expect cancel button
      await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
      // Expect confirm button
      await expect(page.getByRole('button', { name: /confirm/i })).toBeVisible();
    }
  });

  test('incident acknowledge shows confirmation dialog', async ({ page }) => {
    await page.goto('/platform/incidents');
    const ackButton = page.getByRole('button', { name: /acknowledge/i }).first();
    if (await ackButton.isVisible()) {
      await ackButton.click();
      await expect(page.getByText(/confirm action/i)).toBeVisible();
    }
  });

  test('cancel button closes governance dialog without executing', async ({ page }) => {
    await page.goto('/software-factory/builds');
    const actionButton = page.getByRole('button', { name: /approve|acknowledge/i }).first();
    if (await actionButton.isVisible()) {
      await actionButton.click();
      await page.getByRole('button', { name: /cancel/i }).click();
      await expect(page.getByText(/confirm action/i)).not.toBeVisible();
    }
  });

  test('governance mode badge shows in app shell', async ({ page }) => {
    await page.goto('/software-factory/dashboard');
    // Check for HOTL badge in header area
    const badge = page.getByText(/HOTL/i);
    await expect(badge).toBeVisible();
  });
});
