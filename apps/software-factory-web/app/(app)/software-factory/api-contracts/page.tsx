import { DataTable, DocsCodePanel, Drawer, PageHeader } from '@bac/ui';

import { apiContractRows, sdkIntegrationSnippet } from '@/features/data';

export default function ApiContractsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="API Contract Explorer"
        title="API contract explorer"
        description="Review generated client seams, endpoint ownership, and the contract surfaces that feed the AI Software Factory experience."
        actions={
          <Drawer
            description="The shared API client package is the single place where generated and handwritten clients meet."
            title="Generated client seam"
            triggerLabel="Inspect client package"
          >
            <DocsCodePanel
              tabs={[
                {
                  content:
                    'Generated clients live behind `@bac/api-clients`, while page code consumes stable view-model oriented helpers.\n\nThat keeps route modules small and makes transport swaps less risky.',
                  id: 'docs',
                  label: 'Design',
                },
                {
                  content: sdkIntegrationSnippet,
                  id: 'code',
                  kind: 'code',
                  label: 'Usage',
                },
              ]}
              title="Client integration point"
            />
          </Drawer>
        }
      />
      <DataTable
        columns={[
          { header: 'Method', render: (row) => row.method },
          { header: 'Path', render: (row) => row.path },
          { header: 'Owner', render: (row) => row.owner },
          { header: 'Client seam', render: (row) => row.client },
          { header: 'Summary', render: (row) => row.summary },
        ]}
        description="These endpoints are intentionally presented alongside their generated-client entry points."
        rows={apiContractRows}
        title="Factory contracts"
      />
    </div>
  );
}
