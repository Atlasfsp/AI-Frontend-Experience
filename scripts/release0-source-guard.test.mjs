import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { assertMatrixSource } from './release0-source-guard.mjs';

const head = '0123456789abcdef0123456789abcdef01234567';
function run(actual = head, status = '', fail = false) {
  const calls = [];
  const git = (...args) => {
    calls.push(args.join(' '));
    if (fail) throw new Error('git refused');
    if (args[0] === 'rev-parse') return actual + '\n';
    if (args[0] === 'status') return status;
    throw new Error('unexpected git invocation');
  };
  return { git, calls };
}

test('accepts only pristine exact frontend HEAD', () => {
  const x = run();
  assert.doesNotThrow(() => assertMatrixSource(head, x.git));
  assert.deepEqual(x.calls, ['rev-parse HEAD', 'status --porcelain=v1 --untracked-files=all']);
});

test('rejects caller-supplied labels, mismatched SHAs and dirty tracked or untracked files', () => {
  for (const invalid of ['', 'main', head.toUpperCase(), head.slice(0, 7)]) {
    const x = run();
    assert.throws(() => assertMatrixSource(invalid, x.git));
    assert.equal(x.calls.length, 0);
  }
  assert.throws(() => assertMatrixSource(head, run('f'.repeat(40)).git), /does not match/);
  assert.throws(() => assertMatrixSource(head, run(head, ' M package.json').git), /not pristine/);
  assert.throws(() => assertMatrixSource(head, run(head, '?? extra.json').git), /not pristine/);
  assert.throws(() => assertMatrixSource(head, run(head, '', true).git));
});
