import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..', '..');
const manifestPath = path.join(root, 'governance/manifest.json');
const docPath = path.join(root, 'docs/GOVERNANCE_MODE.md');
const agentsPath = path.join(root, 'AGENTS.md');
const readmePath = path.join(root, 'README.md');

const expectedRepo = 'AI-Frontend-Experience';
const requiredCannotBypass = [
  'policy-checks',
  'compatibility-validation',
  'release-documentation',
  'docs-validation',
  'security-validation',
  'design-handoff-validation',
  'generated-client-validation',
];

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
ensure(manifest.schemaVersion === '1.0.0', 'Unexpected governance manifest schemaVersion');
ensure(manifest.repo === expectedRepo, 'Governance manifest repo mismatch');
ensure(manifest.defaultMode === 'HOTL', 'HOTL must remain the default governance mode');
ensure(['HOTL', 'HITL', 'FULL_AUTONOMY'].every((mode) => manifest.allowedModes.includes(mode)), 'All governance modes must be explicitly allowed');
ensure(manifest.allowedModes.includes(manifest.activeMode), 'Active governance mode must be allowed');

for (const key of ['requiresPullRequest', 'requiresDocsUpdate', 'requiresAuditTrail', 'requiresReleaseNote', 'requiresCompatibilityReview']) {
  ensure(manifest.switchControl?.[key] === true, `switchControl.${key} must be true`);
}
for (const key of ['policyChecks', 'compatibilityChecks', 'releaseDocsUpdate', 'ciValidation', 'securityChecks']) {
  ensure(manifest.requiredGuardrails?.[key] === true, `requiredGuardrails.${key} must be true`);
}
for (const control of requiredCannotBypass) {
  ensure(manifest.repoSpecific?.cannotBypass?.includes(control), `Missing non-bypassable control: ${control}`);
}

const governanceDoc = fs.readFileSync(docPath, 'utf8');
const agentsDoc = fs.readFileSync(agentsPath, 'utf8');
const readme = fs.readFileSync(readmePath, 'utf8');
for (const requiredText of ['HOTL', 'HITL', 'FULL_AUTONOMY', 'governance/manifest.json']) {
  ensure(governanceDoc.includes(requiredText), `Repo governance doc must reference ${requiredText}`);
  ensure(agentsDoc.includes(requiredText), `AGENTS.md must reference ${requiredText}`);
}
ensure(readme.includes('GOVERNANCE_MODE.md'), 'README must reference docs/GOVERNANCE_MODE.md');

const report = {
  repo: expectedRepo,
  defaultMode: manifest.defaultMode,
  activeMode: manifest.activeMode,
  allowedModes: manifest.allowedModes,
  nonBypassableControls: manifest.repoSpecific.cannotBypass,
  valid: true,
};
fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
fs.writeFileSync(path.join(root, 'reports/governance-mode-report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
