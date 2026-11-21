import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { RELEASE0_MATRIX_CASES, release0MatrixCommand, requireRelease0MatrixVerdict } from './release0-matrix-verdict.mjs';

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
test('matrix command passes the JSON reporter to Vitest, not to pnpm', () => {
  const args = release0MatrixCommand('/tmp/report.json');
  const run = args.indexOf('run');
  assert.deepEqual(args.slice(0, run + 1), ['--filter', '@bac/software-factory-web', 'exec', 'vitest', 'run']);
  assert.ok(args.indexOf('--reporter=json') > run);
  assert.ok(args.indexOf('--outputFile=/tmp/report.json') > run);
  assert.ok(!args.includes('--passWithNoTests'));
});
