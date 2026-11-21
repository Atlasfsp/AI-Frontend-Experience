import { z } from 'zod';

import { loadWebConfig } from '@bac/config';

const ServerEnvSchema = z.object({
  BAC_AUTH_CALLBACK_URL: z.string().url().optional(),
  BAC_AUTH_CLIENT_SECRET: z.string().min(1).optional(),
  BAC_SESSION_SECRET: z.string().min(16).optional(),
});

export function loadAppEnv(source: Record<string, string | undefined> = process.env) {
  const publicConfig = loadWebConfig(source);
  const serverConfig = ServerEnvSchema.parse(source);
  const sessionSecret =
    serverConfig.BAC_SESSION_SECRET ?? 'development-session-secret-change-me';

  if (
    (publicConfig.environment === 'staging' || publicConfig.environment === 'production') &&
    (sessionSecret.length < 32 ||
      sessionSecret === 'development-session-secret-change-me')
  ) {
    throw new Error(
      'BAC_SESSION_SECRET must be a non-default value of at least 32 characters outside development and test.',
    );
  }

  return {
    ...publicConfig,
    authCallbackUrl:
      serverConfig.BAC_AUTH_CALLBACK_URL ?? 'http://localhost:3000/api/auth/callback',
    authClientSecret: serverConfig.BAC_AUTH_CLIENT_SECRET,
    sessionSecret,
  };
}
