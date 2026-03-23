import { z } from 'zod';

import { createFeatureFlags } from './features';
import type { BacRegion } from './regions';
import { regionConfig } from './regions';

const RuntimeEnvSchema = z.object({
  appName: z.string().min(1),
  environment: z.enum(['development', 'test', 'staging', 'production']),
  enableMockApi: z.boolean(),
  defaultRegion: z.enum(['ng', 'za', 'eu']),
  proxyThroughBff: z.boolean(),
  authBaseUrl: z.string().url(),
  authClientId: z.string().min(1),
  authIssuerUrl: z.string().url(),
  authAuthorizeUrl: z.string().url(),
  authTokenUrl: z.string().url(),
  authLogoutUrl: z.string().url(),
  sdxApiUrl: z.string().url(),
  platformApiUrl: z.string().url(),
  hasuraUrl: z.string().url(),
  swaggerUrl: z.string().url(),
  otelCollectorUrl: z.string().url(),
});

export type RuntimeEnv = z.infer<typeof RuntimeEnvSchema> & {
  region: BacRegion;
  regionDefaults: (typeof regionConfig)[BacRegion];
  features: ReturnType<typeof createFeatureFlags>;
};

export function loadWebConfig(source: Record<string, string | undefined> = process.env): RuntimeEnv {
  const parsed = RuntimeEnvSchema.parse({
    appName: source.NEXT_PUBLIC_BAC_APP_NAME ?? source.BAC_APP_NAME ?? 'BAC Frontend Experience',
    environment: source.NEXT_PUBLIC_BAC_ENV ?? source.BAC_ENV ?? 'development',
    enableMockApi:
      (source.NEXT_PUBLIC_BAC_ENABLE_MOCK_API ?? source.BAC_ENABLE_MOCK_API ?? 'true') === 'true',
    defaultRegion: source.NEXT_PUBLIC_BAC_DEFAULT_REGION ?? 'ng',
    proxyThroughBff:
      (source.NEXT_PUBLIC_BAC_PROXY_THROUGH_BFF ?? source.BAC_PROXY_THROUGH_BFF ?? 'true') === 'true',
    authBaseUrl:
      source.NEXT_PUBLIC_BAC_AUTH_BASE_URL ??
      'https://auth.example.com/application/o/bac-frontend/',
    authClientId: source.NEXT_PUBLIC_BAC_AUTH_CLIENT_ID ?? 'bac-frontend-web',
    authIssuerUrl:
      source.NEXT_PUBLIC_BAC_AUTH_ISSUER_URL ?? 'https://auth.example.com/application/o/bac-frontend/',
    authAuthorizeUrl:
      source.NEXT_PUBLIC_BAC_AUTH_AUTHORIZE_URL ??
      'https://auth.example.com/application/o/authorize/',
    authTokenUrl:
      source.NEXT_PUBLIC_BAC_AUTH_TOKEN_URL ?? 'https://auth.example.com/application/o/token/',
    authLogoutUrl:
      source.NEXT_PUBLIC_BAC_AUTH_LOGOUT_URL ?? 'https://auth.example.com/application/o/logout/',
    sdxApiUrl: source.NEXT_PUBLIC_BAC_SDX_API_URL ?? 'http://localhost:8080',
    platformApiUrl: source.NEXT_PUBLIC_BAC_PLATFORM_API_URL ?? 'http://localhost:8081',
    hasuraUrl: source.NEXT_PUBLIC_BAC_HASURA_URL ?? 'http://localhost:8082/v1/graphql',
    swaggerUrl:
      source.NEXT_PUBLIC_BAC_SWAGGER_URL ?? 'http://localhost:8080/api/openapi/openapi.json',
    otelCollectorUrl:
      source.NEXT_PUBLIC_BAC_OTEL_COLLECTOR_URL ?? 'http://localhost:4318/v1/traces',
  });

  return {
    ...parsed,
    region: parsed.defaultRegion,
    regionDefaults: regionConfig[parsed.defaultRegion],
    features: createFeatureFlags(source),
  };
}
