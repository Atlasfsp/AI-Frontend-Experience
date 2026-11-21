import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';

import { assertMatrixSource } from './release0-source-guard.mjs';
import {
  redactEvidence,
  release0MatrixCommand,
  requireRelease0MatrixVerdict,
  summarizeRelease0MatrixReport,
} from './release0-matrix-verdict.mjs';

const {
  FLUXCORE_INTEGRATION_DESCRIPTOR: descriptor,
  FLUXCORE_INTEGRATION_BACKEND_SHA: backend,
  FLUXCORE_INTEGRATION_FRONTEND_SHA: frontend,
  FLUXCORE_MATRIX_EVIDENCE_DIR: requestedEvidenceDir,
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

// Evidence lives outside the source checkout so Vitest cannot create untracked
// artifacts in the pinned tree, and it is never deleted: a failed run must
// remain diagnosable after teardown.
const checkout = realpathSync(process.cwd());
let evidenceDir;
if (requestedEvidenceDir) {
  evidenceDir = resolve(requestedEvidenceDir);
  if (!existsSync(evidenceDir)) mkdirSync(evidenceDir, { recursive: true });
} else {
  evidenceDir = mkdtempSync(join(tmpdir(), 'fluxcore-release0-matrix-'));
}
const insideCheckout = relative(checkout, realpathSync(evidenceDir));
if (!insideCheckout || (!insideCheckout.startsWith('..') && !isAbsolute(insideCheckout))) {
  throw new Error('Matrix evidence directory must be outside the source checkout');
}
const reportPath = join(evidenceDir, 'matrix.json');
if (existsSync(reportPath) || existsSync(join(evidenceDir, 'verdict.json'))) {
  throw new Error('Matrix evidence directory already holds a run; use a fresh directory');
}

const result = spawnSync('pnpm', release0MatrixCommand(reportPath), {
  encoding: 'utf8',
  env: { ...process.env, FLUXCORE_INTEGRATION_REQUIRED: '1' },
  maxBuffer: 64 * 1024 * 1024,
  stdio: ['ignore', 'pipe', 'pipe'],
  timeout: 900000,
});
const stdout = redactEvidence(result.stdout);
const stderr = redactEvidence(result.stderr);
process.stdout.write(stdout);
process.stderr.write(stderr);
writeFileSync(join(evidenceDir, 'vitest.stdout.log'), stdout, { flag: 'wx' });
writeFileSync(join(evidenceDir, 'vitest.stderr.log'), stderr, { flag: 'wx' });

let report = null;
let reportSha256 = null;
try {
  const raw = readFileSync(reportPath, 'utf8');
  report = JSON.parse(raw);
  const redacted = redactEvidence(JSON.stringify(report, null, 2));
  writeFileSync(reportPath, redacted);
  reportSha256 = createHash('sha256').update(redacted).digest('hex');
} catch {
  report = null;
}

let matrixVerdict = 'BLOCKED';
let matrixReason;
if (result.error || result.signal) {
  matrixReason = `test runner did not finish (${result.error ? 'spawn error or timeout' : `signal ${result.signal}`})`;
} else if (result.status !== 0) {
  // Recorded separately from the report: Vitest also exits non-zero for
  // unhandled errors raised after every case has passed.
  matrixReason = `test runner exited ${result.status}`;
} else {
  try {
    requireRelease0MatrixVerdict(report);
    matrixVerdict = 'PASS';
    matrixReason = 'all seven named tests passed in a JSON report';
  } catch {
    matrixReason = 'required JSON test evidence absent, invalid or incomplete';
  }
}
let sourceGuard = 'PASS';
try {
  assertMatrixSource(frontend); // Re-check after the matrix.
} catch {
  sourceGuard = 'BLOCKED';
}
const verdict = {
  classification: 'AUTHOR_RUN_LOCAL_DEVELOPMENT',
  backend_sha: backend, frontend_sha: frontend,
  source_guard: sourceGuard, matrix_verdict: matrixVerdict,
  matrix_reason: matrixReason, matrix_exit: result.status ?? null,
  matrix_signal: result.signal ?? null,
  report_summary: summarizeRelease0MatrixReport(report),
  report_sha256: reportSha256,
  evidence_dir: evidenceDir,
  simulated: fixture.simulated, persistence: fixture.persistence,
  untested: ['real browser', 'live Authentik/SpiceDB/YugabyteDB', 'images/deployment', 'independent Jenkins/signing'],
  production_ready: false, execution_authorized: false,
  independently_attested_gates: '0/18',
};
// Exclusive create: nothing after this point can replace the recorded outcome.
writeFileSync(join(evidenceDir, 'verdict.json'), `${JSON.stringify(verdict, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ ...verdict, report_summary: { ...verdict.report_summary, cases: undefined } }));
process.exitCode = sourceGuard === 'PASS' && matrixVerdict === 'PASS' ? 0 : 2;
