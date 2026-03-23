import { describe, expect, it } from 'vitest';

import { loadWebConfig } from './index';

describe('loadWebConfig', () => {
  it('loads defaults', () => {
    const config = loadWebConfig({});
    expect(config.appName).toBe('BAC Frontend Experience');
    expect(config.enableMockApi).toBe(true);
    expect(config.region).toBe('ng');
  });

  it('rejects malformed URLs', () => {
    expect(() =>
      loadWebConfig({
        NEXT_PUBLIC_BAC_AUTH_BASE_URL: 'not-a-url',
      }),
    ).toThrow();
  });
});
