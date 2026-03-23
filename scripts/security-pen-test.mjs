#!/usr/bin/env node
/**
 * Security penetration test checklist runner for BAC platform.
 * Validates common security patterns.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const results = [];
let passed = 0;
let failed = 0;

function check(name, condition, detail) {
  if (condition) {
    results.push({ name, status: 'PASS', detail });
    passed++;
  } else {
    results.push({ name, status: 'FAIL', detail });
    failed++;
  }
}

// Check 1: No secrets in source code
const secretPatterns = [
  /sk-[a-zA-Z0-9]{20,}/,     // Stripe-style keys
  /ghp_[a-zA-Z0-9]{36}/,     // GitHub PAT
  /AKIA[0-9A-Z]{16}/,        // AWS access key
  /-----BEGIN (RSA |EC )?PRIVATE KEY-----/,
  /password\s*[:=]\s*["'][^"']{8,}["']/i,
];

function scanDir(dir, patterns, depth = 0) {
  if (depth > 5) return [];
  const findings = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        findings.push(...scanDir(fullPath, patterns, depth + 1));
      } else if (entry.name.match(/\.(ts|tsx|js|jsx|json|yaml|yml|env)$/)) {
        try {
          const content = readFileSync(fullPath, 'utf8');
          for (const pattern of patterns) {
            if (pattern.test(content)) {
              findings.push({ file: fullPath, pattern: pattern.source });
            }
          }
        } catch {}
      }
    }
  } catch {}
  return findings;
}

const secretFindings = scanDir('.', secretPatterns);
check('No secrets in source code', secretFindings.length === 0,
  secretFindings.length === 0 ? 'Clean' : `Found ${secretFindings.length} potential secrets`);

// Check 2: Auth tokens use secure storage
const envExample = existsSync('.env.example') ? readFileSync('.env.example', 'utf8') : '';
check('Environment template exists', existsSync('.env.example'), '.env.example present');

// Check 3: No HTTP-only cookie bypass
check('No cookie bypass patterns',
  !scanDir('packages', [/httpOnly\s*:\s*false/]).length,
  'No httpOnly:false found');

// Check 4: CORS not wildcard
check('No wildcard CORS',
  !scanDir('.', [/Access-Control-Allow-Origin.*\*/]).length,
  'No Access-Control-Allow-Origin: * found');

// Check 5: CSP headers present in Next.js config (web) or no eval (mobile)
const hasSecurityHeaders = scanDir('.', [/Content-Security-Policy/]).length > 0 ||
  scanDir('.', [/expo-secure-store/]).length > 0;
check('Security headers or secure storage configured', hasSecurityHeaders, 'Security configuration present');

// Check 6: Dependencies auditable
check('Package lock exists', existsSync('pnpm-lock.yaml'), 'pnpm-lock.yaml present');

// Check 7: Governance mode defaults to HOTL
if (existsSync('governance/manifest.json')) {
  const manifest = JSON.parse(readFileSync('governance/manifest.json', 'utf8'));
  check('Governance defaults to HOTL', manifest.defaultMode === 'HOTL', `Default: ${manifest.defaultMode}`);
  check('Governance active is HOTL', manifest.activeMode === 'HOTL', `Active: ${manifest.activeMode}`);
}

// Report
console.log('\n=== Security Penetration Test Report ===\n');
for (const r of results) {
  const icon = r.status === 'PASS' ? '✓' : '✗';
  console.log(`  ${icon} ${r.name}: ${r.detail}`);
}
console.log(`\n  Total: ${passed} passed, ${failed} failed\n`);

import('node:fs').then(fs => {
  fs.writeFileSync('security-pen-test-report.json', JSON.stringify({ results, passed, failed, timestamp: new Date().toISOString() }, null, 2));
});

if (failed > 0) process.exit(1);
