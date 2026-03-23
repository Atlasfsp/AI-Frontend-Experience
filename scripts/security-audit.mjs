#!/usr/bin/env node
/**
 * Security audit script for BAC Companion Mobile.
 * Runs pnpm audit and produces structured report.
 */
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const REPORT_PATH = resolve(ROOT, 'security-audit-report.json');

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
    const stdout = execSync('pnpm audit --json', {
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
    // If pnpm audit truly failed (e.g. not installed), return a minimal object.
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Parse & categorize                                                 */
/* ------------------------------------------------------------------ */

function categorize(auditJson) {
  const counts = emptyCounts();
  const vulnerabilities = [];

  if (!auditJson) {
    return { counts, vulnerabilities };
  }

  // pnpm audit --json can return different shapes depending on version.
  // Handle the common advisory-map shape (`advisories`) and the flat
  // vulnerability list shape (`vulnerabilities`).

  if (auditJson.advisories && typeof auditJson.advisories === 'object') {
    for (const advisory of Object.values(auditJson.advisories)) {
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
  if (auditJson.metadata?.vulnerabilities) {
    const meta = auditJson.metadata.vulnerabilities;
    for (const sev of SEVERITY_ORDER) {
      if (typeof meta[sev] === 'number' && meta[sev] > counts[sev]) {
        counts[sev] = meta[sev];
      }
    }
  }

  return { counts, vulnerabilities };
}

/* ------------------------------------------------------------------ */
/*  Summary table                                                      */
/* ------------------------------------------------------------------ */

function printSummary(counts, vulnerabilities) {
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

  console.log('');
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

function main() {
  console.log('Running security audit...');

  const auditJson = runAudit();
  const { counts, vulnerabilities } = categorize(auditJson);

  // Write JSON report
  const report = {
    generatedAt: new Date().toISOString(),
    counts,
    vulnerabilities,
    raw: auditJson,
  };
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`JSON report written to ${REPORT_PATH}`);

  // Print human-readable summary
  printSummary(counts, vulnerabilities);

  // Fail if any critical or high vulnerabilities
  if (counts.critical > 0 || counts.high > 0) {
    console.error(
      `FAIL: Found ${counts.critical} critical and ${counts.high} high severity vulnerabilities.`,
    );
    process.exit(1);
  }

  console.log('PASS: No critical or high severity vulnerabilities found.');
}

main();
