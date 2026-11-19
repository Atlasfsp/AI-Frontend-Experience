import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as ts from 'typescript';
import { expect, test } from '@playwright/test';

import type * as FenceApi from '../../apps/software-factory-web/lib/release0-write-fence';

declare global {
  interface Window {
    __release0Fence?: typeof FenceApi;
  }
}

let server: Server;
let origin: string;

/** Load the exact production fence source, not a copied browser mock. */
test.beforeAll(async () => {
  const source = readFileSync(
    resolve(process.cwd(), 'apps/software-factory-web/lib/release0-write-fence.ts'), 'utf8',
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    reportDiagnostics: true,
  });
  if (compiled.diagnostics?.some((d) => d.category === ts.DiagnosticCategory.Error)) {
    throw new Error('Release 0 browser fence source failed to transpile');
  }
  server = createServer((request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    if (request.method !== 'GET') {
      response.writeHead(405).end();
      return;
    }
    if (request.url === '/fence.mjs') {
      response.setHeader('Content-Type', 'text/javascript; charset=utf-8');
      response.end(compiled.outputText);
      return;
    }
    if (request.url === '/') {
      response.setHeader('Content-Type', 'text/html; charset=utf-8');
      response.end(`<!doctype html><html><head><title>Release 0 browser fence check</title></head>
        <body><script type="module">
        import * as api from '/fence.mjs';
        window.__release0Fence = api;
        document.body.dataset.fenceReady = 'true';
        </script></body></html>`);
      return;
    }
    response.writeHead(404).end();
  });
  await new Promise<void>((ok, fail) => {
    server.once('error', fail);
    server.listen(0, '127.0.0.1', ok);
  });
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;
});

test.afterAll(async () => {
  if (server) await new Promise<void>((ok, fail) => {
    server.close((error) => error ? fail(error) : ok());
  });
});

test('a confirmed browser reload cannot silently replace an unresolved write key', async ({ page }) => {
  await page.goto(origin);
  await page.locator('body[data-fence-ready="true"]').waitFor();
  const scopedKey = await page.evaluate(async () => {
    const api = window.__release0Fence!;
    const key = await api.scopedWriteFenceKey('user:alice', 'tenant-a', 'project-a');
    const owner = api.beginWriteFence(key);
    if (!owner || !api.settleWriteFence(owner, false)) throw new Error('failed to reserve opaque write marker');
    return key;
  });
  await page.reload();
  await page.locator('body[data-fence-ready="true"]').waitFor();
  const restored = await page.evaluate(async (key) => {
    const api = window.__release0Fence!;
    const scoped = await api.scopedWriteFenceKey('user:alice', 'tenant-a', 'project-a');
    return {
      sameKey: scoped === key,
      blocked: api.isWriteFenceBlocked(scoped),
      reservation: api.beginWriteFence(scoped),
      stored: window.localStorage.getItem(scoped),
    };
  }, scopedKey);
  expect(restored.sameKey).toBe(true);
  expect(restored.blocked).toBe(true);
  expect(restored.reservation).toBeNull();
  expect(restored.stored).toContain('UNCONFIRMED');
  expect(restored.stored).not.toMatch(/user:alice|tenant-a|project-a|Idempotency-Key|access.token/);
});

test('same-origin second tab blocks while a different verified scope stays separate', async ({ context, page }) => {
  await page.goto(origin);
  await page.locator('body[data-fence-ready="true"]').waitFor();
  const firstKey = await page.evaluate(async () => {
    const api = window.__release0Fence!;
    const key = await api.scopedWriteFenceKey('user:alice', 'tenant-a', 'project-a');
    if (!api.beginWriteFence(key)) throw new Error('first tab could not reserve marker');
    return key;
  });
  const second = await context.newPage();
  try {
    await second.goto(origin);
    await second.locator('body[data-fence-ready="true"]').waitFor();
    const result = await second.evaluate(async (existingKey) => {
      const api = window.__release0Fence!;
      const alice = await api.scopedWriteFenceKey('user:alice', 'tenant-a', 'project-a');
      const bob = await api.scopedWriteFenceKey('user:bob', 'tenant-a', 'project-a');
      const otherTenant = await api.scopedWriteFenceKey('user:alice', 'tenant-b', 'project-a');
      return {
        same: alice === existingKey,
        blocked: api.isWriteFenceBlocked(alice),
        otherTabDenied: api.beginWriteFence(alice) === null,
        distinctPrincipal: bob !== alice,
        distinctTenant: otherTenant !== alice,
      };
    }, firstKey);
    expect(result).toEqual({
      same: true, blocked: true, otherTabDenied: true,
      distinctPrincipal: true, distinctTenant: true,
    });
  } finally {
    await second.close();
  }
});

test('malformed persisted browser marker remains blocked after reload', async ({ page }) => {
  await page.goto(origin);
  await page.locator('body[data-fence-ready="true"]').waitFor();
  const key = await page.evaluate(async () => {
    const api = window.__release0Fence!;
    const key = await api.scopedWriteFenceKey('user:alice', 'tenant-a', 'project-a');
    window.localStorage.setItem(key, '{corrupt');
    return key;
  });
  await page.reload();
  await page.locator('body[data-fence-ready="true"]').waitFor();
  expect(await page.evaluate((key) => {
    const api = window.__release0Fence!;
    return api.isWriteFenceBlocked(key) && api.beginWriteFence(key) === null;
  }, key)).toBe(true);
});
