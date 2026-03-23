#!/usr/bin/env node

/**
 * Bundle Budget Checker
 *
 * Reads Next.js build output from .next directories across apps,
 * compares gzipped JS chunk sizes against budgets defined in
 * bundle-budgets.json, and exits with code 1 if any budget is exceeded.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, basename, relative } from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');

// ---------------------------------------------------------------------------
// Load budgets config
// ---------------------------------------------------------------------------

const budgetsPath = join(ROOT, 'bundle-budgets.json');
if (!existsSync(budgetsPath)) {
  console.error('ERROR: bundle-budgets.json not found at repo root.');
  process.exit(1);
}

const { budgets } = JSON.parse(readFileSync(budgetsPath, 'utf-8'));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Recursively collect all .js files under a directory.
 */
function collectJsFiles(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectJsFiles(full, files);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(full);
    }
  }
  return files;
}

/**
 * Return the gzipped size in bytes for a file.
 */
function gzippedSize(filePath) {
  const raw = readFileSync(filePath);
  return gzipSync(raw).length;
}

/**
 * Format bytes to human-readable KB string.
 */
function formatKb(bytes) {
  return (bytes / 1024).toFixed(1);
}

// ---------------------------------------------------------------------------
// Discover app directories (monorepo apps/* or single-app root)
// ---------------------------------------------------------------------------

function discoverAppDirs() {
  const appsDir = join(ROOT, 'apps');
  const dirs = [];

  if (existsSync(appsDir)) {
    for (const entry of readdirSync(appsDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const nextDir = join(appsDir, entry.name, '.next');
        if (existsSync(nextDir)) {
          dirs.push({ name: entry.name, nextDir });
        }
      }
    }
  }

  // Fallback: single-app at repo root
  const rootNext = join(ROOT, '.next');
  if (dirs.length === 0 && existsSync(rootNext)) {
    dirs.push({ name: basename(ROOT), nextDir: rootNext });
  }

  return dirs;
}

// ---------------------------------------------------------------------------
// Budget evaluation
// ---------------------------------------------------------------------------

const violations = [];

function checkBudgets(appName, nextDir) {
  const staticDir = join(nextDir, 'static');
  if (!existsSync(staticDir)) {
    console.log(`  [skip] No static directory found for ${appName}`);
    return;
  }

  const allJsFiles = collectJsFiles(staticDir);
  if (allJsFiles.length === 0) {
    console.log(`  [skip] No JS files found for ${appName}`);
    return;
  }

  for (const budget of budgets) {
    if (budget.name === 'total-js') {
      // Sum gzipped sizes of ALL JS files
      let totalBytes = 0;
      for (const f of allJsFiles) {
        totalBytes += gzippedSize(f);
      }
      const totalKb = totalBytes / 1024;
      const status = totalKb > budget.maxSizeKb ? 'FAIL' : 'PASS';
      const line = `  [${status}] ${appName} / total-js: ${formatKb(totalBytes)} KB gzipped (budget: ${budget.maxSizeKb} KB)`;
      console.log(line);
      if (status === 'FAIL') {
        violations.push(line);
      }
    } else if (budget.pattern) {
      // Match files whose path contains the pattern
      const matching = allJsFiles.filter((f) => {
        const rel = relative(staticDir, f);
        return rel.includes(budget.pattern);
      });

      if (budget.name === 'page-chunk') {
        // Each matching file is checked individually
        for (const f of matching) {
          const gz = gzippedSize(f);
          const kb = gz / 1024;
          const rel = relative(staticDir, f);
          const status = kb > budget.maxSizeKb ? 'FAIL' : 'PASS';
          const line = `  [${status}] ${appName} / page-chunk (${rel}): ${formatKb(gz)} KB gzipped (budget: ${budget.maxSizeKb} KB)`;
          console.log(line);
          if (status === 'FAIL') {
            violations.push(line);
          }
        }
      } else {
        // Sum matched files (e.g., main-app-chunk matching "app/layout")
        let totalBytes = 0;
        for (const f of matching) {
          totalBytes += gzippedSize(f);
        }
        if (matching.length > 0) {
          const kb = totalBytes / 1024;
          const status = kb > budget.maxSizeKb ? 'FAIL' : 'PASS';
          const line = `  [${status}] ${appName} / ${budget.name}: ${formatKb(totalBytes)} KB gzipped (budget: ${budget.maxSizeKb} KB)`;
          console.log(line);
          if (status === 'FAIL') {
            violations.push(line);
          }
        } else {
          console.log(`  [skip] ${appName} / ${budget.name}: no files matching pattern "${budget.pattern}"`);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log('Bundle Budget Check');
console.log('='.repeat(60));

const appDirs = discoverAppDirs();

if (appDirs.length === 0) {
  console.log('No .next build output found. Run `pnpm build` first.');
  process.exit(1);
}

for (const { name, nextDir } of appDirs) {
  console.log(`\nApp: ${name}`);
  checkBudgets(name, nextDir);
}

console.log('\n' + '='.repeat(60));

if (violations.length > 0) {
  console.log(`\nBUDGET EXCEEDED -- ${violations.length} violation(s):\n`);
  for (const v of violations) {
    console.log(v);
  }
  console.log('');
  process.exit(1);
} else {
  console.log('\nAll bundle budgets passed.');
  process.exit(0);
}
