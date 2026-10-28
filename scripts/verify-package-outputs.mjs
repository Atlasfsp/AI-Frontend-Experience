// Run after the workspace build: successful compilation must produce the
// JavaScript and declaration files that package consumers actually resolve.
import assert from 'node:assert/strict';
import console from 'node:console';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let checked = 0;
function targets(value) {
  if (typeof value === 'string') return [value];
  if (!value || typeof value !== 'object') return [];
  return Object.values(value).flatMap(targets);
}
for (const entry of readdirSync(path.join(root, 'packages'), { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const dir = path.join(root, 'packages', entry.name);
  const manifest = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'));
  for (const target of new Set([manifest.main, manifest.types, ...targets(manifest.exports)].filter(Boolean))) {
    if (!target.replace(/^\.\//, '').startsWith('dist/')) continue;
    assert.ok(existsSync(path.join(dir, target)), `${manifest.name}: missing built entry ${target}`);
    checked++;
  }
}
assert.ok(checked > 0, 'No built package entries checked');
console.log(`Verified ${checked} built package entry points.`);
