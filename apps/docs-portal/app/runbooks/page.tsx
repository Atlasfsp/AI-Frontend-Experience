import { DataTable, PageHeader, TerminalPanel } from '@bac/ui';

const runbookRows = [
  {
    id: 'deploy-validation',
    scenario: 'Post-merge deployment validation',
    action: 'Run pnpm check, verify app shells render, smoke the command palette, and confirm route guards still behave correctly.',
    owner: 'Frontend Platform',
  },
  {
    id: 'auth-failure',
    scenario: 'OIDC or callback degradation',
    action: 'Switch to mock auth for local development, verify Authentik callback env vars, and confirm signed session cookie parsing.',
    owner: 'Security + Frontend Platform',
  },
  {
    id: 'contract-drift',
    scenario: 'OpenAPI or GraphQL contract drift',
    action: 'Re-sync contracts, update generated client seams, and validate explorer pages before product route changes land.',
    owner: 'API Platform',
  },
  {
    id: 'release-evidence',
    scenario: 'Release evidence gap',
    action: 'Review build dashboard, release manager queue, audit timeline, and compliance terminal output before promotion.',
    owner: 'Software Factory',
  },
] as const;

const runbookCommands = `$ pnpm check
$ pnpm dev:software-factory
$ pnpm dev:platform
$ pnpm sync:openapi
$ pnpm sync:proto

Record the failing route, tenant, workspace, and auth mode before escalating.`;

export default function RunbooksPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="BAC Docs"
        title="Runbooks"
        description="Operational guidance for the most common frontend and integration workflows, written so on-call responders can move quickly without guessing."
      />
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <DataTable
          title="Operational scenarios"
          rows={runbookRows.map((row) => ({ ...row }))}
          columns={[
            { header: 'Scenario', render: (row) => row.scenario },
            { header: 'Primary action', render: (row) => row.action },
            { header: 'Owner', render: (row) => row.owner },
          ]}
        />
        <TerminalPanel
          title="First-response commands"
          lines={runbookCommands.split('\n')}
        />
      </div>
    </div>
  );
}
