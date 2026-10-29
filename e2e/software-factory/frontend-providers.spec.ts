import { test, expect } from '@playwright/test';
import { mockLoginSoftwareFactory } from '../fixtures';

test('provider catalog renders disconnected candidates without connection actions', async ({
  page,
}) => {
  await mockLoginSoftwareFactory(page);
  await page.goto('/software-factory/settings');
  await page
    .getByRole('link', { name: 'Review provider connection posture' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Frontend design and code platforms' }),
  ).toBeVisible();
  await expect(
    page.getByRole('status', {
      name: 'Provider connection and release status',
    }),
  ).toContainText('No provider connection is authorized');
  const providers = page.getByRole('article');
  await expect(providers).toHaveCount(7);
  for (const name of ['Vercel v0', 'Designer2', 'Google Stitch', 'Figma']) {
    const provider = page.getByRole('article', { name });
    await expect(provider).toContainText('NOT_VERIFIED_LIVE');
    await expect(provider).toContainText('NOT_CONNECTED');
    await expect(provider.getByRole('button')).toHaveCount(0);
    await expect(provider.locator('input')).toHaveCount(0);
  }
  for (const target of ['SkyForge', 'AppForge']) {
    const card = page.getByRole('article', { name: target });
    await expect(card).toContainText('Not connected');
    await expect(card).toContainText('Deployment action: unavailable');
    await expect(card.getByRole('button')).toHaveCount(0);
  }
  await expect(
    page.getByRole('article', { name: 'Additional frontend providers' }),
  ).toContainText('CAPABILITY-BASED ONBOARDING');
  await expect(
    page.getByText('This page is read-only.', { exact: false }),
  ).toBeVisible();
});
