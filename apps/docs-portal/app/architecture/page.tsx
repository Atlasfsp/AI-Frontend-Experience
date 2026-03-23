import { DataTable, DetailList, DocsCodePanel, PageHeader } from '@bac/ui';

const architectureRows = [
  {
    id: 'software-factory',
    layer: 'Application',
    surface: 'software-factory-web',
    responsibility: 'PRD intake, design and domain review, contract exploration, builds, releases, audit evidence.',
  },
  {
    id: 'platform-automation',
    layer: 'Application',
    surface: 'platform-automation-web',
    responsibility: 'Global control plane, regions, clusters, tenant factory, GitOps, observability, incidents, and quotas.',
  },
  {
    id: 'docs-portal',
    layer: 'Application',
    surface: 'docs-portal',
    responsibility: 'Search-ready product docs, architectural guidance, runbooks, API references, and support handoff.',
  },
  {
    id: 'shared-ui',
    layer: 'Shared package',
    surface: '@bac/ui',
    responsibility: 'Enterprise shell, data presentation primitives, drawers, modals, charts, terminal panels, and docs/code surfaces.',
  },
  {
    id: 'integration',
    layer: 'Shared package',
    surface: '@bac/api-clients + @bac/auth + @bac/observability',
    responsibility: 'Typed client seams, signed session handling, OIDC helpers, and trace-friendly request contexts.',
  },
] as const;

const packageMapSnippet = `apps/
  software-factory-web/
  platform-automation-web/
  docs-portal/
packages/
  ui/
  design-tokens/
  api-clients/
  auth/
  config/
  observability/
  testing/
  eslint-config/
  tsconfig/`;

export default function ArchitecturePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="BAC Docs"
        title="Architecture"
        description="The web foundation is organized for long-term growth: product apps at the edge, shared packages in the center, and explicit seams for auth, contracts, and observability."
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <DataTable
          title="Layer map"
          description="Each layer owns a clear concern so new features can scale without turning the apps into giant route files."
          rows={architectureRows.map((row) => ({ ...row }))}
          columns={[
            { header: 'Layer', render: (row) => row.layer },
            { header: 'Surface', render: (row) => row.surface },
            { header: 'Responsibility', render: (row) => row.responsibility },
          ]}
        />

        <DetailList
          title="Architectural commitments"
          items={[
            {
              label: 'XP and TDD',
              value: 'Critical shell behavior, shared primitives, and seam-heavy flows should remain covered by fast tests before route-specific refinements.',
            },
            {
              label: 'DDD boundaries',
              value: 'Software Factory and Platform Automation share primitives, not feature-state or page-specific orchestration logic.',
            },
            {
              label: 'Migration posture',
              value: 'Integrations target current platform seams while staying ready to move behind shared hosted services later.',
            },
          ]}
        />
      </div>

      <DocsCodePanel
        title="Repository shape"
        description="Shared packages are the contract between product experiences. The route trees stay lean by delegating reusable behaviors into the workspace."
        tabs={[
          {
            id: 'packages',
            label: 'Monorepo map',
            kind: 'code',
            content: packageMapSnippet,
          },
          {
            id: 'principles',
            label: 'Principles',
            content:
              'Auth-aware routing lives at middleware and layout boundaries.\n\nGenerated clients integrate through @bac/api-clients instead of ad hoc fetch calls.\n\nObservability hooks belong in shared packages so page teams inherit trace structure automatically.',
          },
        ]}
      />
    </div>
  );
}
