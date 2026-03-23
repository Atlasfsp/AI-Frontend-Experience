import { getSwaggerDocument } from '@bac/api-clients';
import { DataTable, DetailList, DocsCodePanel, PageHeader } from '@bac/ui';

import { createFactoryRequestContext } from '@/features/request-context';
import { getServerSession } from '@/lib/session';

export default async function SwaggerPage() {
  const session = await getServerSession();
  const context = createFactoryRequestContext(session);
  const spec = await getSwaggerDocument(context);
  const rows = Object.entries(spec.paths).flatMap(([path, operations]) =>
    Object.entries((operations ?? {}) as Record<string, { summary?: string }>).map(
      ([method, operation]) => ({
        id: `${method}-${path}`,
        method: method.toUpperCase(),
        path,
        summary: operation.summary ?? 'Contract summary pending',
      }),
    ),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Swagger / OpenAPI Explorer"
        title="Swagger and OpenAPI explorer"
        description="First-class contract explorer embedded directly in the software-factory experience so delivery teams can inspect APIs without leaving the operator shell."
      />
      <DetailList
        items={[
          { label: 'Spec title', value: spec.info.title },
          { label: 'Version', value: spec.info.version },
          { label: 'OpenAPI', value: spec.openapi },
          {
            hint: 'Routed through the shared Swagger client seam.',
            label: 'Source',
            monospace: true,
            value: '@bac/api-clients/swagger/client.ts',
          },
        ]}
        title="Specification summary"
      />
      <DataTable
        columns={[
          { header: 'Method', render: (row) => row.method },
          { header: 'Path', render: (row) => row.path },
          { header: 'Summary', render: (row) => row.summary },
        ]}
        description="This explorer is structured for future Swagger UI embedding, request execution, and policy-aware examples."
        rows={rows}
        title="Endpoint inventory"
      />
      <DocsCodePanel
        tabs={[
          {
            content:
              'The explorer is a first-class software-factory page because API contracts drive PRD intake, architecture review, and release validation.\n\nFuture enhancements can embed Swagger UI or live try-it panels behind the same page contract.',
            id: 'docs',
            label: 'Why it matters',
          },
          {
            content: JSON.stringify(spec.paths, null, 2),
            id: 'json',
            kind: 'code',
            label: 'Paths JSON',
          },
        ]}
        title="Contract payload"
      />
    </div>
  );
}
