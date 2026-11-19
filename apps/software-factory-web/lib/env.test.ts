import { describe, expect, it } from 'vitest';

import { loadAppEnv } from './env';

const developmentSecret = 'development-session-secret-change-me';

describe('loadAppEnv session secret policy', () => {
  it('retains the local development fallback', () => {
    expect(loadAppEnv({ NEXT_PUBLIC_BAC_ENV: 'development' }).sessionSecret).toBe(
      developmentSecret,
    );
  });

  it.each(['staging', 'production'])(
    'rejects the default secret in %s',
    (environment) => {
      expect(() =>
        loadAppEnv({
          NEXT_PUBLIC_BAC_ENV: environment,
          BAC_SESSION_SECRET: developmentSecret,
        }),
      ).toThrow(/BAC_SESSION_SECRET must be a non-default value/);
    },
  );

  it.each(['staging', 'production'])(
    'requires a configured secret in %s',
    (environment) => {
      expect(() =>
        loadAppEnv({ NEXT_PUBLIC_BAC_ENV: environment }),
      ).toThrow(/BAC_SESSION_SECRET must be a non-default value/);
    },
  );

  it('accepts a configured session secret in staging', () => {
    const sessionSecret = 'release-zero-test-secret-with-32-chars';

    expect(
      loadAppEnv({
        NEXT_PUBLIC_BAC_ENV: 'staging',
        BAC_SESSION_SECRET: sessionSecret,
      }).sessionSecret,
    ).toBe(sessionSecret);
  });
});
