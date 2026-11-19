import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { assertMatrixSource } from './release0-source-guard.mjs';
import { requireRelease0MatrixVerdict } from './release0-matrix-verdict.mjs';

const {
  FLUXCORE_INTEGRATION_DESCRIPTOR: descriptor,
  FLUXCORE_INTEGRATION_BACKEND_SHA: backend,
  FLUXCORE_INTEGRATION_FRONTEND_SHA: frontend,
} = process.env;
if (!descriptor || ![backend, frontend].every((sha) => /^[a-f0-9]{40}$/.test(sha ?? ''))) {
  throw new Error('An explicit disposable descriptor and exact backend/frontend SHAs are required');
}
assertMatrixSource(frontend); // Do not trust a caller-supplied SHA as evidence.
const fixture = JSON.parse(readFileSync(descriptor, 'utf8'));
const endpoint = new URL(fixture.url);
const control = new URL(fixture.control_url);
if (fixture.backend_sha !== backend ||
    fixture.classification !== 'AUTHOR_RUN_LOCAL_DEVELOPMENT' ||
    fixture.execution_authorized !== false ||
    fixture.schema_version !== 11 ||
    endpoint.protocol !== 'http:' || endpoint.hostname !== '127.0.0.1' ||
    control.protocol !== 'http:' || control.hostname !== '127.0.0.1' ||
    control.origin !== endpoint.origin) {
  throw new Error('Unapproved cross-repository fixture descriptor');
}

// Report directory is outside the source checkout, so Vitest cannot create
// untracked release artifacts inside either pinned working tree.
const reportDir = mkdtempSync(join(tmpdir(), 'fluxcore-release0-matrix-'));
const reportPath = join(reportDir, 'matrix.json');
let result;
let matrixVerdict = 'BLOCKED';
let matrixReason = 'not executed';
try {
  result = spawnSync('pnpm', [
    '--filter', '@bac/software-factory-web', 'test',
    'components/release0-integration.test.tsx',
    '--reporter=json', `--outputFile=${reportPath}`,
  ], {
    stdio: 'inherit',
    env: { ...process.env, FLUXCORE_INTEGRATION_REQUIRED: '1' },
    timeout: 900000,
  });
  if (result.error || result.status !== 0 || result.signal) {
    matrixReason = 'test runner failed, timed out or was interrupted';
  } else {
    // Unlike --passWithNoTests, this refuses a green exit when the required
    // suite is skipped, renamed, absent, partially run or missing test cases.
    requireRelease0MatrixVerdict(JSON.parse(readFileSync(reportPath, 'utf8')));
    matrixVerdict = 'PASS';
    matrixReason = 'all six named tests passed in a JSON report';
  }
} catch {
  matrixReason = 'required JSON test evidence absent, invalid or incomplete';
} finally {
  rmSync(reportDir, { recursive: true, force: true });
}
let sourceGuard = 'PASS';
try {
  assertMatrixSource(frontend); // Re-check after the matrix.
} catch {
  sourceGuard = 'BLOCKED';
}
console.log(JSON.stringify({
  classification: 'AUTHOR_RUN_LOCAL_DEVELOPMENT',
  backend_sha: backend, frontend_sha: frontend,
  source_guard: sourceGuard, matrix_verdict: matrixVerdict,
  matrix_reason: matrixReason, matrix_exit: result?.status ?? null,
  matrix_signal: result?.signal ?? null,
  simulated: fixture.simulated, persistence: fixture.persistence,
  untested: ['real browser', 'live Authentik/SpiceDB/YugabyteDB', 'images/deployment', 'independent Jenkins/signing'],
  production_ready: false, execution_authorized: false,
  independently_attested_gates: '0/18',
}));
process.exitCode = sourceGuard === 'PASS' && matrixVerdict === 'PASS' ? 0 : 2;
