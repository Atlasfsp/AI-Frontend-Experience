import { describe, expect, it, vi } from 'vitest';

import { GovernedBrowserSession, type BrowserTool } from './index';

const context = {
  tenantId: 'nvuto/acme',
  actorId: 'user-42',
  authorizationDecisionId: 'spicedb-1',
  correlationId: 'corr-1',
};

const readTool: BrowserTool = {
  name: 'page.read',
  accessibleName: 'Read the current page',
  consequence: 'read',
  execute: vi.fn(async () => ({ title: 'Synthetic page' })),
};

const submitTool: BrowserTool = {
  name: 'form.submit',
  accessibleName: 'Submit the reviewed form',
  consequence: 'mutation',
  execute: vi.fn(async () => ({ submitted: true })),
};

function session(overrides: Record<string, unknown> = {}) {
  return new GovernedBrowserSession({
    ...context,
    allowedTools: ['page.read', 'form.submit'],
    allowedOrigins: ['https://app.nvuto.test'],
    enabled: true,
    maxSteps: 2,
    maxReadRetries: 1,
    timeoutMs: 100,
    tools: [readTool, submitTool],
    ...overrides,
  });
}

describe('GovernedBrowserSession', () => {
  it('executes an allowlisted read and emits a tenant-bound audit record', async () => {
    const result = await session().execute({
      tool: 'page.read',
      arguments: {},
      currentOrigin: 'https://app.nvuto.test',
    });

    expect(result.value).toEqual({ title: 'Synthetic page' });
    expect(result.audit).toMatchObject({
      tenantId: 'nvuto/acme',
      authorizationDecisionId: 'spicedb-1',
      tool: 'page.read',
      consequence: 'read',
      outcome: 'SUCCEEDED',
    });
    expect(result.audit).not.toHaveProperty('arguments');
  });

  it('rejects non-allowlisted tools and prompt-injection signals', async () => {
    await expect(
      session().execute({
        tool: 'cookie.export',
        arguments: {},
        currentOrigin: 'https://app.nvuto.test',
      }),
    ).rejects.toThrow(/allowlist/i);
    await expect(
      session().execute({
        tool: 'page.read',
        arguments: {},
        currentOrigin: 'https://app.nvuto.test',
        promptInjectionDetected: true,
      }),
    ).rejects.toThrow(/prompt injection/i);
  });

  it('requires a human confirmation receipt for mutations', async () => {
    await expect(
      session().execute({
        tool: 'form.submit',
        arguments: {},
        currentOrigin: 'https://app.nvuto.test',
        idempotencyKey: 'submit-1',
      }),
    ).rejects.toThrow(/confirmation/i);

    const result = await session().execute({
      tool: 'form.submit',
      arguments: {},
      currentOrigin: 'https://app.nvuto.test',
      confirmationId: 'confirm-1',
      idempotencyKey: 'submit-1',
    });
    expect(result.audit.confirmationId).toBe('confirm-1');
  });

  it('enforces the step budget independently of model output', async () => {
    const governed = session({ maxSteps: 1 });
    await governed.execute({
      tool: 'page.read',
      arguments: {},
      currentOrigin: 'https://app.nvuto.test',
    });
    await expect(
      governed.execute({
        tool: 'page.read',
        arguments: {},
        currentOrigin: 'https://app.nvuto.test',
      }),
    ).rejects.toThrow(/step budget/i);
  });

  it('supports an operator kill switch', async () => {
    const governed = session();
    governed.cancel('operator-request');
    await expect(
      governed.execute({
        tool: 'page.read',
        arguments: {},
        currentOrigin: 'https://app.nvuto.test',
      }),
    ).rejects.toThrow(/cancelled/i);
  });

  it('rejects browser-held model credentials', () => {
    expect(() => session({ apiKey: 'sk-enterprise-secret' })).toThrow(/server-side model gateway/i);
  });

  it('requires opt-in and blocks cross-origin navigation', async () => {
    await expect(
      session({ enabled: false }).execute({
        tool: 'page.read',
        arguments: {},
        currentOrigin: 'https://app.nvuto.test',
      }),
    ).rejects.toThrow(/disabled/i);

    await expect(
      session().execute({
        tool: 'page.read',
        arguments: {},
        currentOrigin: 'https://app.nvuto.test',
        navigationTarget: 'https://evil.example/phish',
      }),
    ).rejects.toThrow(/origin/i);
  });

  it('requires accessible tool names', () => {
    expect(() =>
      session({
        tools: [{ name: 'bad.tool', consequence: 'read', execute: async () => null }],
        allowedTools: ['bad.tool'],
      }),
    ).toThrow(/accessible name/i);
  });

  it('retries reads within policy but never repeats an idempotent mutation', async () => {
    let attempts = 0;
    const flaky: BrowserTool = {
      name: 'page.read',
      accessibleName: 'Read the current page',
      consequence: 'read',
      execute: async () => {
        attempts += 1;
        if (attempts === 1) throw new Error('temporary tool failure');
        return { ok: true };
      },
    };
    const mutation = vi.fn(async () => ({ submitted: true }));
    const governed = session({
      tools: [flaky, { ...submitTool, execute: mutation }],
      maxSteps: 3,
    });
    await expect(
      governed.execute({
        tool: 'page.read',
        arguments: {},
        currentOrigin: 'https://app.nvuto.test',
      }),
    ).resolves.toMatchObject({ value: { ok: true } });
    expect(attempts).toBe(2);

    const action = {
      tool: 'form.submit',
      arguments: {},
      currentOrigin: 'https://app.nvuto.test',
      confirmationId: 'confirm-2',
      idempotencyKey: 'mutation-1',
    };
    const first = await governed.execute(action);
    const replay = await governed.execute(action);
    expect(replay).toBe(first);
    expect(mutation).toHaveBeenCalledTimes(1);
  });
});
