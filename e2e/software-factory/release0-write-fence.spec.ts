import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as ts from 'typescript';
import { expect, test } from '@playwright/test';

type FenceApi = typeof import('../../apps/software-factory-web/lib/release0-write-fence');

declare global {
  interface Window {
    __release0Fence?: FenceApi;
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

test('a full browser reload cannot silently replace an unresolved write key', async ({ page }) => {
  await page.goto(origin);
  await page.locator('body[data-fence-ready="true"]').waitFor();
  const scoped = await page.evaluate(async () => {
    const api = window.__release0Fence!;
    const projectKey = await api.scopedWriteFenceKey('user:alice', 'tenant-a', 'project-a');
    const createKey = await api.scopedCreateFenceKey('user:alice', 'tenant-a', 'workspace-a');
    if (createKey === projectKey) throw new Error('creation scope collided with project scope');
    for (const key of [projectKey, createKey]) {
      const owner = api.beginWriteFence(key);
      if (!owner || !api.settleWriteFence(owner, false)) {
        throw new Error('failed to reserve opaque project or creation marker');
      }
    }
    return { projectKey, createKey };
  });
  await page.reload();
  await page.locator('body[data-fence-ready="true"]').waitFor();
  const restored = await page.evaluate(async (original) => {
    const api = window.__release0Fence!;
    const project = await api.scopedWriteFenceKey('user:alice', 'tenant-a', 'project-a');
    const creation = await api.scopedCreateFenceKey('user:alice', 'tenant-a', 'workspace-a');
    return {
      sameProject: project === original.projectKey,
      sameCreate: creation === original.createKey,
      projectBlocked: api.isWriteFenceBlocked(project),
      createBlocked: api.isWriteFenceBlocked(creation),
      projectReservation: api.beginWriteFence(project),
      createReservation: api.beginWriteFence(creation),
      stored: [project, creation].map((key) => window.localStorage.getItem(key)),
    };
  }, scoped);
  expect(restored.sameProject).toBe(true);
  expect(restored.sameCreate).toBe(true);
  expect(restored.projectBlocked).toBe(true);
  expect(restored.createBlocked).toBe(true);
  expect(restored.projectReservation).toBeNull();
  expect(restored.createReservation).toBeNull();
  for (const marker of restored.stored) {
    expect(marker).toContain('UNCONFIRMED');
    expect(marker).not.toMatch(/user:alice|tenant-a|project-a|workspace-a|Idempotency-Key|access.token/);
  }
});

test('same-origin second tab blocks while a different verified scope stays separate', async ({ context, page }) => {
  await page.goto(origin);
  await page.locator('body[data-fence-ready="true"]').waitFor();
  const firstKeys = await page.evaluate(async () => {
    const api = window.__release0Fence!;
    const project = await api.scopedWriteFenceKey('user:alice', 'tenant-a', 'project-a');
    const creation = await api.scopedCreateFenceKey('user:alice', 'tenant-a', 'workspace-a');
    for (const key of [project, creation]) {
      if (!api.beginWriteFence(key)) throw new Error('first tab could not reserve marker');
    }
    return { project, creation };
  });
  const second = await context.newPage();
  try {
    await second.goto(origin);
    await second.locator('body[data-fence-ready="true"]').waitFor();
    const result = await second.evaluate(async (existing) => {
      const api = window.__release0Fence!;
      const project = await api.scopedWriteFenceKey('user:alice', 'tenant-a', 'project-a');
      const creation = await api.scopedCreateFenceKey('user:alice', 'tenant-a', 'workspace-a');
      const bob = await api.scopedWriteFenceKey('user:bob', 'tenant-a', 'project-a');
      const otherTenant = await api.scopedWriteFenceKey('user:alice', 'tenant-b', 'project-a');
      const otherCreation = await api.scopedCreateFenceKey('user:bob', 'tenant-a', 'workspace-a');
      return {
        sameProject: project === existing.project,
        sameCreate: creation === existing.creation,
        projectBlocked: api.isWriteFenceBlocked(project),
        createBlocked: api.isWriteFenceBlocked(creation),
        projectDenied: api.beginWriteFence(project) === null,
        createDenied: api.beginWriteFence(creation) === null,
        distinctPrincipal: bob !== project,
        distinctTenant: otherTenant !== project,
        distinctCreationPrincipal: otherCreation !== creation,
      };
    }, firstKeys);
    expect(result).toEqual({
      sameProject: true, sameCreate: true,
      projectBlocked: true, createBlocked: true,
      projectDenied: true, createDenied: true,
      distinctPrincipal: true, distinctTenant: true, distinctCreationPrincipal: true,
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
