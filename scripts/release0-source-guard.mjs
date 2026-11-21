import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Source identity only. Never a signature, independent review or release attestation. */
export function assertMatrixSource(expected, runGit = (...args) =>
  execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })) {
  if (typeof expected !== 'string' || !/^[0-9a-f]{40}$/.test(expected)) {
    throw new Error('matrix frontend source requires an exact lowercase 40-hex commit');
  }
  const head = String(runGit('rev-parse', 'HEAD')).trim();
  if (head !== expected) throw new Error('matrix frontend source does not match checked-out HEAD');
  // Include untracked files; an ignored cache/build directory is not evidence.
  const state = String(runGit('status', '--porcelain=v1', '--untracked-files=all')).trim();
  if (state !== '') throw new Error('matrix frontend source is not pristine');
}
