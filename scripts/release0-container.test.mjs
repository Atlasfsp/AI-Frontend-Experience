import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const dockerfile = readFileSync(new URL('../Dockerfile.release0', import.meta.url), 'utf8');
const startup = readFileSync(new URL('../docker/start-frontend.sh', import.meta.url), 'utf8');
// Exercise the real validation program, without starting a server or container.
const validation = startup.split("node -e '\n")[1]?.split("\n'\n")[0];
assert.ok(validation, 'startup contains the runtime validation program');

const validEnv = {
  BAC_ENV: 'staging',
  NEXT_PUBLIC_BAC_ENV: 'staging',
  NEXT_PUBLIC_BAC_ENABLE_MOCK_API: 'false',
  NEXT_PUBLIC_BAC_PROXY_THROUGH_BFF: 'true',
  NEXT_PUBLIC_BAC_FEATURE_LIVE_SUBSCRIPTIONS: 'false',
  NEXT_PUBLIC_BAC_FEATURE_PREVIEW_DEPLOYS: 'false',
  NEXT_PUBLIC_BAC_GOVERNANCE_MODE: 'HOTL',
  NEXT_PUBLIC_BAC_DEFAULT_REGION: 'ng',
  BAC_SESSION_SECRET: 'fixture-only-session-secret-with-at-least-32-characters',
  BAC_AUTH_CALLBACK_URL: 'https://console.atlasfsp.live/api/auth/callback',
  NEXT_PUBLIC_BAC_AUTH_CLIENT_ID: 'fluxcore-web',
  NEXT_PUBLIC_BAC_AUTH_BASE_URL: 'https://auth.atlasfsp.live/application/o/fluxcore/',
  NEXT_PUBLIC_BAC_AUTH_ISSUER_URL: 'https://auth.atlasfsp.live/application/o/fluxcore/',
  NEXT_PUBLIC_BAC_AUTH_AUTHORIZE_URL: 'https://auth.atlasfsp.live/application/o/authorize/',
  NEXT_PUBLIC_BAC_AUTH_TOKEN_URL: 'https://auth.atlasfsp.live/application/o/token/',
  NEXT_PUBLIC_BAC_AUTH_LOGOUT_URL: 'https://auth.atlasfsp.live/application/o/logout/',
  NEXT_PUBLIC_BAC_API_URL: 'https://api.atlasfsp.live',
  NEXT_PUBLIC_BAC_PLATFORM_API_URL: 'https://platform.atlasfsp.live',
  NEXT_PUBLIC_BAC_HASURA_URL: 'https://hasura.atlasfsp.live/v1/graphql',
  NEXT_PUBLIC_BAC_SWAGGER_URL: 'https://api.atlasfsp.live/openapi.json',
  NEXT_PUBLIC_BAC_OTEL_COLLECTOR_URL: 'https://otel.atlasfsp.live/v1/traces',
  NEXT_PUBLIC_BAC_SDX_API_URL: 'http://api:8080',
};

function validate(overrides) {
  return spawnSync(process.execPath, ['-e', validation], {
    env: { ...validEnv, ...overrides },
    encoding: 'utf8',
  });
}

test('container validation accepts the Compose runtime contract without network I/O', () => {
  assert.equal(validate({}).status, 0);
});

for (const [name, overrides] of [
  ['mock API', { NEXT_PUBLIC_BAC_ENABLE_MOCK_API: 'true' }],
  ['development mode', { BAC_ENV: 'development' }],
  ['default session key', { BAC_SESSION_SECRET: 'development-session-secret-change-me' }],
  ['missing session key', { BAC_SESSION_SECRET: '' }],
  ['insecure callback', { BAC_AUTH_CALLBACK_URL: 'http://console.atlasfsp.live/api/auth/callback' }],
  ['placeholder issuer', { NEXT_PUBLIC_BAC_AUTH_ISSUER_URL: 'https://auth.example.com' }],
  ['missing issuer', { NEXT_PUBLIC_BAC_AUTH_ISSUER_URL: '' }],
  ['arbitrary internal HTTP target', { NEXT_PUBLIC_BAC_SDX_API_URL: 'http://other:8080' }],
  ['preview deployments', { NEXT_PUBLIC_BAC_FEATURE_PREVIEW_DEPLOYS: 'true' }],
  ['live subscriptions', { NEXT_PUBLIC_BAC_FEATURE_LIVE_SUBSCRIPTIONS: 'true' }],
  ['autonomous governance', { NEXT_PUBLIC_BAC_GOVERNANCE_MODE: 'FULL_AUTONOMY' }],
]) {
  test(`container validation refuses ${name}`, () => {
    const result = validate(overrides);
    assert.equal(result.status, 1);
    assert.ok(result.stderr.length > 0);
    assert.ok(!result.stderr.includes(validEnv.BAC_SESSION_SECRET));
  });
}

test('Dockerfile retains patched workspace dependencies and uses the monorepo standalone server', () => {
  assert.match(dockerfile, /COPY patches\/ \.\/patches\//);
  assert.match(dockerfile, /COPY --from=deps \/app\/ \.\//);
  assert.match(dockerfile, /COPY \. \.\//);
  assert.match(dockerfile, /pnpm install --frozen-lockfile/);
  assert.match(dockerfile, /pnpm exec turbo run build/);
  assert.match(dockerfile, /apps\/\$\{APP_NAME\}\/server\.js/);
  assert.match(dockerfile, /CMD \["\/usr\/local\/bin\/start-frontend\.sh"\]/);
  assert.doesNotMatch(dockerfile, /(?:ARG|ENV)\s+BAC_(?:SESSION_SECRET|AUTH_CLIENT_SECRET)/);
  assert.doesNotMatch(dockerfile, /npx |turbo prune/);
});
