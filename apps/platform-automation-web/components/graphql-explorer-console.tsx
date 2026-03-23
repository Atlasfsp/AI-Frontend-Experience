'use client';

import { useMemo, useState } from 'react';

import { Button, Card, DataTable, DocsCodePanel } from '@bac/ui';

import { graphqlPresets, type GraphqlPreset } from '@/features/graphql-explorer';

interface ExecutionHistoryRow {
  id: string;
  mode: string;
  operation: string;
  status: string;
  timestamp: string;
}

export function GraphqlExplorerConsole({
  enableMockApi,
}: {
  enableMockApi: boolean;
}) {
  const [selectedPresetId, setSelectedPresetId] = useState(graphqlPresets[0]?.id ?? '');
  const [query, setQuery] = useState(graphqlPresets[0]?.query ?? '');
  const [variablesText, setVariablesText] = useState(graphqlPresets[0]?.variables ?? '{}');
  const [operationName, setOperationName] = useState(graphqlPresets[0]?.operationName ?? '');
  const [history, setHistory] = useState<ExecutionHistoryRow[]>([]);
  const [result, setResult] = useState<string>('// Execute a query to inspect the response envelope.');
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const selectedPreset = useMemo<GraphqlPreset | undefined>(
    () => graphqlPresets.find((preset) => preset.id === selectedPresetId),
    [selectedPresetId],
  );

  async function executeQuery() {
    let variables: unknown;

    try {
      variables = variablesText.trim() ? JSON.parse(variablesText) : undefined;
    } catch {
      setError('Variables must be valid JSON before execution can start.');
      return;
    }

    setIsExecuting(true);
    setError(null);

    try {
      const response = await fetch('/api/graphql-explorer', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          operationName: operationName || undefined,
          query,
          variables,
        }),
      });

      const payload = (await response.json()) as Record<string, unknown>;
      const formatted = JSON.stringify(payload, null, 2);
      setResult(formatted);

      if (!response.ok) {
        const message =
          typeof payload.error === 'string'
            ? payload.error
            : Array.isArray(payload.errors) &&
                payload.errors[0] &&
                typeof payload.errors[0] === 'object' &&
                payload.errors[0] !== null &&
                'message' in payload.errors[0] &&
                typeof payload.errors[0].message === 'string'
              ? payload.errors[0].message
              : 'GraphQL execution failed.';
        setError(message);
      }

      setHistory((current) => [
        {
          id: `${Date.now()}`,
          mode: enableMockApi ? 'Mock' : 'Live',
          operation: operationName || selectedPreset?.label || 'Ad hoc query',
          status: response.ok ? 'Succeeded' : 'Failed',
          timestamp: new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
        ...current,
      ]);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'Unable to contact the GraphQL explorer route.';
      setError(message);
      setResult(JSON.stringify({ error: message }, null, 2));
    } finally {
      setIsExecuting(false);
    }
  }

  function applyPreset(preset: GraphqlPreset) {
    setSelectedPresetId(preset.id);
    setOperationName(preset.operationName);
    setQuery(preset.query);
    setVariablesText(preset.variables);
    setError(null);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
      <div className="space-y-6">
        <Card className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Saved operations</h2>
            <p className="text-sm text-slate-300">
              Start from a curated query, then adjust the payload for the workspace you are investigating.
            </p>
          </div>
          <div className="space-y-3">
            {graphqlPresets.map((preset) => (
              <button
                key={preset.id}
                className={`w-full rounded-[22px] border px-4 py-4 text-left transition ${
                  preset.id === selectedPresetId
                    ? 'border-cyan-300/35 bg-cyan-300/10'
                    : 'border-white/10 bg-slate-950/35 hover:border-white/20 hover:bg-white/[0.05]'
                }`}
                onClick={() => applyPreset(preset)}
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-white">{preset.label}</p>
                  <span className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                    {preset.operationName}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-300">{preset.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {preset.tags.map((tag) => (
                    <span
                      key={`${preset.id}-${tag}`}
                      className="rounded-full border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </Card>

        <DataTable
          title="Execution history"
          description="Recent explorer runs stay visible so operators can see which investigations were executed and whether they succeeded."
          emptyDescription="Execute a query to create the first history entry."
          rows={history}
          columns={[
            { header: 'Operation', render: (row) => row.operation },
            { header: 'Mode', render: (row) => row.mode },
            { header: 'Status', render: (row) => row.status },
            { header: 'Time', render: (row) => row.timestamp },
          ]}
        />
      </div>

      <div className="space-y-6">
        <Card className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-white">Interactive editor</h2>
              <p className="text-sm text-slate-300">
                Query through the explorer route. Mock mode returns deterministic sample data, while live mode hits the authenticated Hasura endpoint.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                {enableMockApi ? 'Mock mode' : 'Live mode'}
              </span>
              <Button onClick={executeQuery} variant="primary">
                {isExecuting ? 'Running...' : 'Execute query'}
              </Button>
            </div>
          </div>

          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-[0.16em] text-slate-500">Operation name</span>
            <input
              className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-white outline-none transition focus:border-cyan-300/40"
              onChange={(event) => setOperationName(event.target.value)}
              value={operationName}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-[0.16em] text-slate-500">Query</span>
            <textarea
              className="min-h-[240px] w-full rounded-[24px] border border-white/10 bg-slate-950/70 px-4 py-4 text-sm text-white outline-none transition focus:border-cyan-300/40"
              onChange={(event) => setQuery(event.target.value)}
              spellCheck={false}
              value={query}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-[0.16em] text-slate-500">Variables</span>
            <textarea
              className="min-h-[150px] w-full rounded-[24px] border border-white/10 bg-slate-950/70 px-4 py-4 text-sm text-white outline-none transition focus:border-cyan-300/40"
              onChange={(event) => setVariablesText(event.target.value)}
              spellCheck={false}
              value={variablesText}
            />
          </label>

          {error ? (
            <div className="rounded-[20px] border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}
        </Card>

        <DocsCodePanel
          title="Result and request guide"
          description="The result pane shows the full JSON envelope so operators can distinguish data, errors, and mock metadata without opening the browser network inspector."
          tabs={[
            {
              id: 'response',
              label: 'Response JSON',
              kind: 'code',
              content: result,
            },
            {
              id: 'guidance',
              label: 'Execution notes',
              content:
                'Use queries and schema introspection for the default workflow.\n\nMutations route through the same policy checks but should usually be driven from dedicated operational surfaces so intent, approval, and audit evidence are clearer.\n\nWhen a live execution fails, compare the workspace context in the header with the variables payload before escalating.',
            },
          ]}
        />
      </div>
    </div>
  );
}
