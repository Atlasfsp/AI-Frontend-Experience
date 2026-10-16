#!/usr/bin/env node
/**
 * Security audit script for BAC Companion Mobile.
 * Runs pnpm audit and produces structured report.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const REPORT_PATH = resolve(ROOT, 'security-audit-report.json');
const BRACES_PATCH_PATH = 'patches/braces@3.0.3.patch';
const WEBPACK_DEV_MIDDLEWARE_PATCH_PATH = 'patches/webpack-dev-middleware@6.1.3.patch';
const REMEDIATED_ADVISORIES = new Map([
  [
    '1240992',
    {
      module: 'braces',
      githubAdvisoryId: 'GHSA-vfj7-8cjw-p6xm',
      patchPath: BRACES_PATCH_PATH,
      patchSha256: '52a8697c6c0a40f6c8ec8a0036ac7b6bed532a76140bc1a88d9771f8b1281a91',
      rationale: 'The local pnpm patch rejects brace nesting deeper than 100 before recursive AST traversal.',
    },
  ],
  [
    '1240027',
    {
      module: 'webpack-dev-middleware',
      githubAdvisoryId: 'GHSA-g84c-rxfj-3j2c',
      patchPath: WEBPACK_DEV_MIDDLEWARE_PATCH_PATH,
      patchSha256: '513e48b222d0ee306fcfd6e2ba6b8b6e4ba7fdd3fb300b289156e946d48cea5c',
      rationale: 'The local pnpm patch protects Storybook\'s transitive webpack-dev-middleware 6.1.3 until Storybook adopts the fixed upstream major.',
    },
  ],
]);

/* ------------------------------------------------------------------ */
/*  Severity helpers                                                   */
/* ------------------------------------------------------------------ */

const SEVERITY_ORDER = ['critical', 'high', 'moderate', 'low', 'info'];

function emptyCounts() {
  return { critical: 0, high: 0, moderate: 0, low: 0, info: 0 };
}

/* ------------------------------------------------------------------ */
/*  Run pnpm audit                                                     */
/* ------------------------------------------------------------------ */

function runAudit() {
  try {
    const stdout = execFileSync('pnpm', ['audit', '--json'], {
      cwd: ROOT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return JSON.parse(stdout);
  } catch (err) {
    // pnpm audit exits non-zero when vulnerabilities are found.
    // The JSON output is still on stdout.
    if (err.stdout) {
      try {
        return JSON.parse(err.stdout);
      } catch {
        // Fall through to empty result.
      }
    }
    throw new Error('pnpm audit failed without a valid JSON report');
  }
}

function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function isVerifiedRemediation(advisory) {
  const remediation = REMEDIATED_ADVISORIES.get(String(advisory.id));
  if (!remediation || advisory.module_name !== remediation.module) return false;
  return sha256File(resolve(ROOT, remediation.patchPath)) === remediation.patchSha256;
}

/* ------------------------------------------------------------------ */
/*  Parse & categorize                                                 */
/* ------------------------------------------------------------------ */

function categorize(auditJson) {
  const counts = emptyCounts();
  const vulnerabilities = [];
  const remediations = [];

  if (!auditJson) {
    return { counts, vulnerabilities, remediations };
  }

  // pnpm audit --json can return different shapes depending on version.
  // Handle the common advisory-map shape (`advisories`) and the flat
  // vulnerability list shape (`vulnerabilities`).

  if (auditJson.advisories && typeof auditJson.advisories === 'object') {
    for (const advisory of Object.values(auditJson.advisories)) {
      if (isVerifiedRemediation(advisory)) {
        remediations.push({
          id: advisory.id,
          module: advisory.module_name,
          githubAdvisoryId: advisory.github_advisory_id,
          ...REMEDIATED_ADVISORIES.get(String(advisory.id)),
        });
        continue;
      }
      const sev = (advisory.severity ?? 'info').toLowerCase();
      if (sev in counts) counts[sev]++;
      vulnerabilities.push({
        id: advisory.id,
        title: advisory.title ?? 'Unknown',
        severity: sev,
        module: advisory.module_name ?? advisory.module ?? 'unknown',
        url: advisory.url ?? null,
        recommendation: advisory.recommendation ?? null,
        findings: advisory.findings ?? [],
      });
    }
  } else if (auditJson.vulnerabilities && typeof auditJson.vulnerabilities === 'object') {
    for (const vuln of Object.values(auditJson.vulnerabilities)) {
      const sev = (vuln.severity ?? 'info').toLowerCase();
      if (sev in counts) counts[sev]++;
      vulnerabilities.push({
        id: vuln.name,
        title: vuln.name,
        severity: sev,
        module: vuln.name,
        url: vuln.url ?? null,
        recommendation: vuln.fixAvailable ? 'Fix available' : 'No fix available',
        range: vuln.range ?? null,
      });
    }
  }

  // Also accept a top-level metadata.vulnerabilities object with counts.
  if (!auditJson.advisories && auditJson.metadata?.vulnerabilities) {
    const meta = auditJson.metadata.vulnerabilities;
    for (const sev of SEVERITY_ORDER) {
      if (typeof meta[sev] === 'number' && meta[sev] > counts[sev]) {
        counts[sev] = meta[sev];
      }
    }
  }

  return { counts, vulnerabilities, remediations };
}

/* ------------------------------------------------------------------ */
/*  Summary table                                                      */
/* ------------------------------------------------------------------ */

function printSummary(counts, vulnerabilities, remediations) {
  console.log('\n=== Security Audit Summary ===\n');
  console.log('Severity     | Count');
  console.log('-------------|------');
  for (const sev of SEVERITY_ORDER) {
    const label = sev.charAt(0).toUpperCase() + sev.slice(1);
    console.log(`${label.padEnd(13)}| ${counts[sev]}`);
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`${'Total'.padEnd(13)}| ${total}`);

  if (vulnerabilities.length > 0) {
    console.log('\n--- Vulnerabilities ---\n');
    for (const v of vulnerabilities) {
      console.log(`  [${v.severity.toUpperCase()}] ${v.module} - ${v.title}`);
      if (v.url) console.log(`         ${v.url}`);
      if (v.recommendation) console.log(`         Recommendation: ${v.recommendation}`);
    }
  }

  if (remediations.length > 0) {
    console.log('\n--- Verified local remediations ---\n');
    for (const remediation of remediations) {
      console.log(`  [PATCHED] ${remediation.module} - ${remediation.githubAdvisoryId}`);
      console.log(`            ${remediation.rationale}`);
    }
  }

  console.log('');
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

function main() {
  console.log('Running security audit...');

  const auditJson = runAudit();
  const { counts, vulnerabilities, remediations } = categorize(auditJson);

  // Write JSON report
  const report = {
    generatedAt: new Date().toISOString(),
    counts,
    vulnerabilities,
    remediations,
    raw: auditJson,
  };
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`JSON report written to ${REPORT_PATH}`);

  // Print human-readable summary
  printSummary(counts, vulnerabilities, remediations);

  // Fail if any critical or high vulnerabilities
  if (counts.critical > 0 || counts.high > 0) {
    console.error(
      `FAIL: Found ${counts.critical} critical and ${counts.high} high severity vulnerabilities.`,
    );
    process.exit(1);
  }

  console.log('PASS: No critical or high severity vulnerabilities found.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}

export { categorize, isVerifiedRemediation };
