import { test, expect } from '@playwright/test';
import { mockLoginPlatformAutomation } from '../fixtures';

test.use({ baseURL: 'http://localhost:3001' });

test.describe('Platform Automation — Authentication', () => {
  test('login page renders with OIDC and operator session buttons', async ({ page }) => {
    await page.goto('/login');

    // Verify the Authentik scaffold badge is visible
    await expect(page.getByText('Authentik scaffold')).toBeVisible();

    // Verify the page heading
    await expect(
      page.getByRole('heading', { name: /Sign in to BAC Platform/i }),
    ).toBeVisible();

    // Verify the OIDC link is present
    await expect(page.getByRole('link', { name: /Continue with Authentik OIDC/i })).toBeVisible();

    // Verify the operator session button
    await expect(
      page.getByRole('button', { name: /Continue with operator session/i }),
    ).toBeVisible();
  });

  test('mock operator login works', async ({ page }) => {
    await mockLoginPlatformAutomation(page);

    // After operator login, the user should be redirected away from login
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10_000 });

    // Should land on the platform area (default redirect)
    expect(page.url()).toContain('/platform');
  });
});
