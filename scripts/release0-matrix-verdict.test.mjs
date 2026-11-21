import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
  RELEASE0_MATRIX_CASES,
  redactEvidence,
  release0MatrixCommand,
  requireRelease0MatrixVerdict,
  summarizeRelease0MatrixReport,
} from './release0-matrix-verdict.mjs';

function passing() {
  return {
    success: true,
    numTotalTests: 7, numPassedTests: 7, numFailedTests: 0,
    numPendingTests: 0, numTodoTests: 0,
    testResults: [{
      name: '/runner/apps/software-factory-web/components/release0-integration.test.tsx',
      status: 'passed',
      assertionResults: RELEASE0_MATRIX_CASES.map((title) => ({ title, status: 'passed' })),
    }],
  };
}
test('accepts only all seven exact named non-skipped matrix cases', () => {
  assert.deepEqual(requireRelease0MatrixVerdict(passing()), { passed: 7 });
});
test('rejects empty/skipped/partial/renamed matrices and false-positive exits', () => {
  for (const mutate of [
    (r) => { r.success = false; },
    (r) => { r.numTotalTests = 0; r.numPassedTests = 0; r.testResults = []; },
    (r) => { r.numPassedTests = 6; r.numPendingTests = 1; },
    (r) => { r.numTotalTests = 6; r.numPassedTests = 6; r.testResults[0].assertionResults.pop(); },
    (r) => { r.numFailedTests = 1; },
    (r) => { r.numTodoTests = 1; },
    (r) => { r.testResults = []; },
    (r) => { r.testResults[0].name = '/tmp/other.test.tsx'; },
    (r) => { r.testResults[0].status = 'failed'; },
    (r) => { r.testResults[0].assertionResults.pop(); },
    (r) => { r.testResults[0].assertionResults[0].title = 'renamed test'; },
    (r) => { r.testResults[0].assertionResults[0].status = 'skipped'; },
    (r) => { r.testResults[0].assertionResults[0].title = r.testResults[0].assertionResults[1].title; },
    (r) => { r.testResults.push(r.testResults[0]); },
  ]) {
    const r = passing();
    mutate(r);
    assert.throws(() => requireRelease0MatrixVerdict(r));
  }
  assert.throws(() => requireRelease0MatrixVerdict(null));
  assert.throws(() => requireRelease0MatrixVerdict({ success: true }));
});
test('matrix command passes the JSON reporter to Vitest, not to pnpm, and keeps readable output', () => {
  const args = release0MatrixCommand('/tmp/report.json');
  const run = args.indexOf('run');
  assert.deepEqual(args.slice(0, run + 1), ['--filter', '@bac/software-factory-web', 'exec', 'vitest', 'run']);
  assert.ok(args.indexOf('--reporter=json') > run);
  assert.ok(args.indexOf('--reporter=default') > run);
  assert.ok(args.indexOf('--outputFile.json=/tmp/report.json') > run);
  assert.ok(!args.includes('--passWithNoTests'));
});
test('summarizes failing and skipped cases from a failed report', () => {
  const r = passing();
  r.success = false;
  r.numPassedTests = 6;
  r.numFailedTests = 1;
  r.testResults[0].status = 'failed';
  r.testResults[0].assertionResults[2] = {
    title: RELEASE0_MATRIX_CASES[2], status: 'failed',
    failureMessages: ['AssertionError: expected 409 to be 200 with Authorization: Bearer abc.def.ghi'],
  };
  const summary = summarizeRelease0MatrixReport(r);
  assert.equal(summary.success, false);
  assert.equal(summary.failed, 1);
  assert.equal(summary.suites[0].file, 'components/release0-integration.test.tsx');
  const failed = summary.cases.filter((c) => c.status === 'failed');
  assert.equal(failed.length, 1);
  assert.equal(failed[0].title, RELEASE0_MATRIX_CASES[2]);
  assert.match(failed[0].failure, /expected 409 to be 200/);
  assert.doesNotMatch(failed[0].failure, /abc\.def\.ghi/);
  assert.deepEqual(summarizeRelease0MatrixReport(null), { report: 'absent_or_unreadable' });
});
test('redacts bearer tokens, signed sessions and credential fields from evidence', () => {
  const session = 'eyJzdWJqZWN0IjoidXNlcl8wMSJ9.aT_rgWaMZFco-JezuDWaFFDNt1clBXL';
  const text = [
    'authorization: Bearer secret-token-1',
    `cookie: bac_session=${session}`,
    '{"access_token":"tok-2","refresh_token":"tok-3","tenant_id":"tenant-a"}',
    'session_secret=hunter2-hunter2',
  ].join('\n');
  const redacted = redactEvidence(text);
  for (const secret of ['secret-token-1', session, 'tok-2', 'tok-3', 'hunter2-hunter2']) {
    assert.ok(!redacted.includes(secret), secret);
  }
  assert.ok(redacted.includes('tenant-a'));
});
