import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { assertMatrixSource } from './release0-source-guard.mjs';

const { FLUXCORE_INTEGRATION_DESCRIPTOR: descriptor, FLUXCORE_INTEGRATION_BACKEND_SHA: backend, FLUXCORE_INTEGRATION_FRONTEND_SHA: frontend } = process.env;
if (!descriptor || ![backend, frontend].every((sha) => /^[a-f0-9]{40}$/.test(sha ?? ''))) {
  throw new Error('An explicit disposable descriptor and exact backend/frontend SHAs are required. The trusted caller must verify clean source before running.');
}
assertMatrixSource(frontend); // Do not trust a caller-provided SHA as evidence.
const fixture = JSON.parse(readFileSync(descriptor, 'utf8'));
if (fixture.backend_sha !== backend || fixture.classification !== 'AUTHOR_RUN_LOCAL_DEVELOPMENT' || new URL(fixture.url).hostname !== '127.0.0.1') {
  throw new Error('Unapproved cross-repository fixture descriptor');
}
const result = spawnSync('pnpm', ['--filter', '@bac/software-factory-web', 'test', 'components/release0-integration.test.tsx'], {
  stdio: 'inherit', env: { ...process.env, FLUXCORE_INTEGRATION_REQUIRED: '1' },
});
let sourceGuard = 'PASS';
try {
  assertMatrixSource(frontend); // Revalidate after the matrix: no source drift.
} catch {
  sourceGuard = 'BLOCKED';
}
console.log(JSON.stringify({
  classification: 'AUTHOR_RUN_LOCAL_DEVELOPMENT', backend_sha: backend, frontend_sha: frontend,
  source_guard: sourceGuard,
  matrix_exit: result.status, signal: result.signal, error: result.error?.message,
  simulated: fixture.simulated, persistence: fixture.persistence,
  untested: ['real browser', 'live Authentik/SpiceDB/YugabyteDB', 'images/deployment', 'independent Jenkins/signing'],
  production_ready: false, execution_authorized: false, independently_attested_gates: '0/18',
}));
process.exitCode = sourceGuard === 'PASS' ? (result.status ?? 1) : 2;
