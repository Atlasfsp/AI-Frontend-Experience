/* global document, window */
import { URL } from 'node:url';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import console from 'node:console';
// Local fixture acceptance only: no model runtime, external identity, or deployment evidence.
import { createServer } from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const output = new URL('../../docs/evidence/create-fixture/', import.meta.url);
await mkdir(output, { recursive: true });
const requests = [];
const fixture = { compilation_method: 'LOCAL_ACCEPTANCE_FIXTURE_NOT_LIVE', estimated_cost_usd: null,
  workforce_plan: { domain: 'Marine biology', evidence_status: 'UNVERIFIED', status: 'PROPOSED',
    expert: { expert_id: 'marine', name: 'Marine biology SME', domain: 'Marine biology', is_verified: false },
    roles: [{ role_id: 'quality', title: 'Quality engineer', capability: 'Testing', discipline: 'engineering', max_risk_tier: 'TIER_1' }],
    execution_authorized: false, required_gates: ['Verify SME expertise', 'Review architecture and security'] } };
const server = createServer(async (req, res) => {
  const chunks = []; for await (const chunk of req) chunks.push(chunk);
  requests.push({ path: req.url, tenant: req.headers['x-tenant-id'], workspace: req.headers['x-workspace-id'], authorizationPresent: !!req.headers.authorization, body: Buffer.concat(chunks).toString() });
  res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(fixture));
});
await new Promise((resolve) => server.listen(8080, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? '/Users/AbiolaOgunsakin1/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
  const context = await browser.newContext();
  context.setDefaultTimeout(180000);

  const denied = await context.request.post('http://localhost:3400/api/proxy/sdx/v1/activation/compiler/compile', { timeout: 180000, data: { idea_prompt: 'A useful app' } });
  assert.equal(denied.status(), 403); assert.equal(requests.length, 0);
  await context.request.post('http://localhost:3400/api/auth/mock-login', { timeout: 180000, form: { tenantId: 'fixture-tenant', workspaceId: 'fixture-workspace', next: '/software-factory/prd-intake' }, maxRedirects: 0 });
  const page = await context.newPage();
  await page.goto('http://localhost:3400/software-factory/prd-intake', { timeout: 180000 });
  await page.getByLabel('What would you like to build?').fill('A coral monitoring application');
  await page.getByLabel('Application domain or industry').fill('Marine biology');
  await page.getByRole('button', { name: 'Prepare engineering proposal' }).click();
  await page.getByText('Marine biology SME', { exact: true }).waitFor({ timeout: 90000 });
  assert.equal(await page.getByRole('button', { name: 'Execution blocked' }).isDisabled(), true);
  assert.equal(await page.getByText('Cost: unknown', { exact: true }).count(), 1);
  assert.equal(requests.length, 1); assert.equal(requests[0].tenant, 'fixture-tenant'); assert.equal(requests[0].workspace, 'fixture-workspace'); assert.equal(requests[0].authorizationPresent, true);
  await page.evaluate(() => { const label = document.createElement('div'); label.textContent = 'LOCAL FIXTURE ACCEPTANCE — not a live model, SME verification, or deployment'; label.style.cssText = 'background:#ffe699;color:#111;padding:12px;font-weight:bold;position:relative;z-index:9999'; document.body.prepend(label); });
  const screenshots = [];
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(700);
    await page.screenshot({ path: new URL(`create-${width}.png`, output).pathname, fullPage: true });
    screenshots.push({ width, documentWidth: await page.evaluate(() => document.documentElement.scrollWidth), viewportWidth: width });
  }
  await page.getByLabel('Application domain or industry').fill('Oceanography');
  assert.equal(await page.getByText('Workforce proposal', { exact: true }).count(), 0);
  await page.getByRole('link', { name: 'Open FluxCore Engineer workspace selector' }).click();
  await page.waitForURL('**/software-factory/workspaces');
  await writeFile(new URL('acceptance.json', output), JSON.stringify({ fixtureOnly: true, anonymousStatus: denied.status(), forwardedRequests: requests, screenshots, engineerPath: new URL(page.url()).pathname, outcome: 'PASS' }, null, 2));
  console.log('PASS: signed mock session → real authenticated BFF → local fixture; 1440/390 screenshots; no execution; same-session Engineer navigation.');
} finally { await browser?.close(); server.close(); }
