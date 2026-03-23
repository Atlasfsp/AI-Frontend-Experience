import { test, expect } from '@playwright/test';
import { mockLoginSoftwareFactory } from '../fixtures';

test.use({ baseURL: 'http://localhost:3000' });

test.describe('Software Factory — Authentication', () => {
  test('login page renders with Authentik scaffold', async ({ page }) => {
    await page.goto('/login');

    // Verify the Authentik scaffold badge is visible
    await expect(page.getByText('Authentik scaffold')).toBeVisible();

    // Verify the page heading
    await expect(page.getByRole('heading', { name: /Sign in to BAC SDX/i })).toBeVisible();

    // Verify the OIDC link is present
    await expect(page.getByRole('link', { name: /Continue with Authentik OIDC/i })).toBeVisible();

    // Verify the mock session form elements
    await expect(page.locator('#tenantId')).toBeVisible();
    await expect(page.locator('#workspaceId')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Continue with mock session/i }),
    ).toBeVisible();
  });

  test('mock login button creates session and redirects to dashboard', async ({ page }) => {
    await mockLoginSoftwareFactory(page);

    // After mock login, the user should be redirected away from the login page
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10_000 });

    // Should land on the software-factory area (default redirect)
    expect(page.url()).toContain('/software-factory');
  });

  test('unauthenticated user is redirected to login', async ({ page }) => {
    // Attempt to access a protected route directly
    await page.goto('/software-factory/dashboard');

    // Should be redirected to login (or show login content)
    await page.waitForURL((url) => url.pathname.includes('/login'), { timeout: 10_000 });

    await expect(page.getByRole('heading', { name: /Sign in/i })).toBeVisible();
  });
});
