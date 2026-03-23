import { z } from 'zod';

import { loadWebConfig } from '@bac/config';

const ServerEnvSchema = z.object({
  BAC_AUTH_CALLBACK_URL: z.string().url().optional(),
  BAC_AUTH_CLIENT_SECRET: z.string().min(1).optional(),
  BAC_SESSION_SECRET: z.string().min(16).default('development-session-secret-change-me'),
});

export function loadAppEnv(source: Record<string, string | undefined> = process.env) {
  const publicConfig = loadWebConfig(source);
  const serverConfig = ServerEnvSchema.parse(source);

  return {
    ...publicConfig,
    authCallbackUrl:
      serverConfig.BAC_AUTH_CALLBACK_URL ?? 'http://localhost:3001/api/auth/callback',
    authClientSecret: serverConfig.BAC_AUTH_CLIENT_SECRET,
    sessionSecret: serverConfig.BAC_SESSION_SECRET,
  };
}
