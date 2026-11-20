// Exact required cases are an explicit release contract, not inferred from
// a possibly empty Vitest run. This is local test qualification only.
export const RELEASE0_MATRIX_CASES = Object.freeze([
  'connects Create → repository → intake/triage → plan/approval → staffing/decision → tasks/cancellation/audit',
  'denies missing/tampered sessions, cross-tenant access, backend authorization and dispatch; recovers after restart',
  'retries the exact unresolved staffing command after reload without creating a duplicate proposal',
  'reports service outages and offers explicit recovery without claiming success',
  'enforces human rejection and approved-plan staffing/task prerequisites',
  'commits concurrent retries once and rejects a competing verified requester without leaking the winner',
]);

export function requireRelease0MatrixVerdict(report) {
  if (!report || typeof report !== 'object' || report.success !== true ||
      report.numTotalTests !== RELEASE0_MATRIX_CASES.length ||
      report.numPassedTests !== RELEASE0_MATRIX_CASES.length ||
      report.numFailedTests !== 0 || report.numPendingTests !== 0 ||
      report.numTodoTests !== 0) {
    throw new Error('Release 0 matrix missing, skipped, failed or unexpectedly changed');
  }
  const suites = report.testResults;
  if (!Array.isArray(suites) || suites.length !== 1 ||
      typeof suites[0]?.name !== 'string' ||
      !suites[0].name.replaceAll('\\', '/').endsWith('/components/release0-integration.test.tsx') ||
      suites[0].status !== 'passed' ||
      !Array.isArray(suites[0].assertionResults) ||
      suites[0].assertionResults.length !== RELEASE0_MATRIX_CASES.length) {
    throw new Error('Release 0 matrix suite identity/count mismatch');
  }
  const cases = suites[0].assertionResults;
  if (cases.some((c) => c.status !== 'passed' || typeof c.title !== 'string') ||
      new Set(cases.map((c) => c.title)).size !== RELEASE0_MATRIX_CASES.length ||
      RELEASE0_MATRIX_CASES.some((title) => !cases.some((c) => c.title === title))) {
    throw new Error('Release 0 matrix required case identity/pass mismatch');
  }
  return { passed: RELEASE0_MATRIX_CASES.length };
}

// `pnpm <script> --reporter=json --outputFile=…` lets pnpm consume and reject
// the reporter flags, so invoke Vitest directly inside the app package.
export function release0MatrixCommand(reportPath) {
  return [
    '--filter', '@bac/software-factory-web', 'exec', 'vitest', 'run',
    '--config', '../../vitest.config.ts',
    'components/release0-integration.test.tsx',
    '--reporter=json', `--outputFile=${reportPath}`,
  ];
}
