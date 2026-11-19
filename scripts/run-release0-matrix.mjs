import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const { FLUXCORE_INTEGRATION_DESCRIPTOR: descriptor, FLUXCORE_INTEGRATION_BACKEND_SHA: backend, FLUXCORE_INTEGRATION_FRONTEND_SHA: frontend } = process.env;
if (!descriptor || ![backend, frontend].every((sha) => /^[a-f0-9]{40}$/.test(sha ?? ''))) {
  throw new Error('An explicit disposable descriptor and exact backend/frontend SHAs are required. The trusted caller must verify clean source before running.');
}
const fixture = JSON.parse(readFileSync(descriptor, 'utf8'));
if (fixture.backend_sha !== backend || fixture.classification !== 'AUTHOR_RUN_LOCAL_DEVELOPMENT' || new URL(fixture.url).hostname !== '127.0.0.1') {
  throw new Error('Unapproved cross-repository fixture descriptor');
}
const result = spawnSync('pnpm', ['--filter', '@bac/software-factory-web', 'test', 'components/release0-integration.test.tsx'], {
  stdio: 'inherit', env: { ...process.env, FLUXCORE_INTEGRATION_REQUIRED: '1' },
});
console.log(JSON.stringify({
  classification: 'AUTHOR_RUN_LOCAL_DEVELOPMENT', backend_sha: backend, frontend_sha: frontend,
  matrix_exit: result.status, signal: result.signal, error: result.error?.message,
  simulated: fixture.simulated, persistence: fixture.persistence,
  untested: ['real browser', 'live Authentik/SpiceDB/YugabyteDB', 'images/deployment', 'independent Jenkins/signing'],
  production_ready: false, execution_authorized: false, independently_attested_gates: '0/18',
}));
process.exitCode = result.status ?? 1;
