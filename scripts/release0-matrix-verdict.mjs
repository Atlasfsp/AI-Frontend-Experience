// Exact required cases are an explicit release contract, not inferred from
// a possibly empty Vitest run. This is local test qualification only.
export const RELEASE0_MATRIX_CASES = Object.freeze([
  'connects Create → repository → intake/triage → plan/approval → staffing/decision → tasks/cancellation/audit',
  'denies missing/tampered sessions, cross-tenant access, backend authorization and dispatch; recovers after restart',
  'retries the exact unresolved staffing command after reload without creating a duplicate proposal',
  'reports service outages and offers explicit recovery without claiming success',
  'enforces human rejection and approved-plan staffing/task prerequisites',
  'commits concurrent retries once and rejects a competing verified requester without leaking the winner',
  'recovers committed Create and Engineer outcomes through both BFF lookup routes after remount without resubmitting writes',
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
// the reporter flags, so invoke Vitest directly inside the app package. The
// default reporter runs alongside JSON so unhandled errors that fail the run
// after every case passed are still printed with their details.
export function release0MatrixCommand(reportPath) {
  return [
    '--filter', '@bac/software-factory-web', 'exec', 'vitest', 'run',
    '--config', '../../vitest.config.ts',
    'components/release0-integration.test.tsx',
    '--reporter=default', '--reporter=json', `--outputFile.json=${reportPath}`,
  ];
}

const redactions = [
  [/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [REDACTED]'],
  [/\beyJ[A-Za-z0-9_-]{8,}(?:\.[A-Za-z0-9_-]+){1,2}/g, '[REDACTED_TOKEN]'],
  [/((?:access_token|id_token|refresh_token|client_secret|session_secret|password|authorization|cookie|bac_session)\\?"?\s*[:=]\s*\\?"?)[^"\\\s,;}]+/gi, '$1[REDACTED]'],
];

/** Removes bearer tokens, signed sessions and credential fields from evidence text. */
export function redactEvidence(text) {
  return redactions.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), String(text ?? ''));
}

const clip = (text, limit = 4000) => (text.length > limit ? `${text.slice(0, limit)}…[truncated]` : text);

/** Case-level outcome, including failures, that survives a failed or partial run. */
export function summarizeRelease0MatrixReport(report) {
  if (!report || typeof report !== 'object') return { report: 'absent_or_unreadable' };
  const suites = Array.isArray(report.testResults) ? report.testResults : [];
  return {
    report: 'present',
    success: report.success === true,
    total: report.numTotalTests ?? null,
    passed: report.numPassedTests ?? null,
    failed: report.numFailedTests ?? null,
    pending: report.numPendingTests ?? null,
    todo: report.numTodoTests ?? null,
    suites: suites.map((suite) => ({
      file: typeof suite?.name === 'string' ? suite.name.replaceAll('\\', '/').split('/').slice(-2).join('/') : null,
      status: suite?.status ?? null,
      ...(suite?.message ? { message: clip(redactEvidence(suite.message)) } : {}),
    })),
    cases: suites.flatMap((suite) => (Array.isArray(suite?.assertionResults) ? suite.assertionResults : []).map((c) => ({
      title: c?.title ?? null,
      status: c?.status ?? null,
      ...(Array.isArray(c?.failureMessages) && c.failureMessages.length
        ? { failure: clip(redactEvidence(c.failureMessages.join('\n'))) }
        : {}),
    }))),
  };
}
