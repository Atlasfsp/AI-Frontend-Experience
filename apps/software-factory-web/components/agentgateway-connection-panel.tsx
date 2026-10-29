'use client';

import React, { useCallback, useEffect, useState } from 'react';

import { Badge, Card } from '@bac/ui';

interface AgentGatewayStatus {
  checked_at: string;
  configured: boolean;
  endpoint?: string;
  models: string[];
  reachable: boolean;
  reason: string;
}

async function fetchGatewayStatus(): Promise<AgentGatewayStatus> {
  const response = await fetch('/api/proxy/sdx/v1/admin/agentgateway/status', {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(
      response.status === 403
        ? 'Your account cannot view gateway settings.'
        : 'The FluxCore API is unavailable or does not yet expose gateway status. Start the local API service, then check again.',
    );
  }
  return (await response.json()) as AgentGatewayStatus;
}

const reasonLabels: Record<string, string> = {
  connected: 'Gateway is responding and serving models.',
  gateway_configuration_invalid: 'The server-side gateway URL is invalid. Check its scheme, host, and path.',
  gateway_not_configured: 'No agentgateway URL is configured for the FluxCore API service.',
  gateway_rejected_request: 'The gateway rejected the model-catalog request. Check its client authentication policy.',
  gateway_unreachable: 'FluxCore could not reach the configured gateway.',
  invalid_gateway_response: 'The gateway response did not match the supported OpenAI-compatible model catalog.',
};

export function AgentGatewayConnectionPanel() {
  const [status, setStatus] = useState<AgentGatewayStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStatus(await fetchGatewayStatus());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to read gateway status.');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchGatewayStatus()
      .then((nextStatus) => {
        if (active) setStatus(nextStatus);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : 'Unable to read gateway status.');
        setStatus(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const connected = status?.configured && status.reachable;

  return (
    <Card>
      <section aria-labelledby="agentgateway-heading" className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/75">
              Model connections
            </p>
            <h2 id="agentgateway-heading" className="mt-2 text-xl font-semibold text-white">
              Agentgateway
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Route model traffic through the approved gateway. Provider API keys stay with agentgateway; FluxCore only checks the gateway model catalog.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {status && (
              <Badge variant={connected ? 'success' : status.configured ? 'warning' : 'neutral'}>
                {connected ? 'Gateway reachable' : status.configured ? 'Needs attention' : 'Not configured'}
              </Badge>
            )}
            <button
              aria-label="Refresh agentgateway connection status"
              className="rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-white hover:border-cyan-200/60 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
              disabled={loading}
              onClick={() => void refresh()}
              type="button"
            >
              {loading ? 'Checking…' : 'Check connection'}
            </button>
          </div>
        </div>

        {error ? (
          <p aria-live="polite" className="rounded-lg border border-rose-300/25 bg-rose-950/30 p-3 text-sm text-rose-100">
            {error}
          </p>
        ) : status ? (
          <div aria-live="polite" className="grid gap-4 md:grid-cols-[1fr_1fr]">
            <div className="rounded-lg border border-white/10 bg-slate-950/35 p-4">
              <p className="text-sm font-medium text-white">Connection status</p>
              <p className="mt-2 text-sm text-slate-300">
                {reasonLabels[status.reason] ?? 'Gateway status is unknown.'}
              </p>
              {status.endpoint && (
                <p className="mt-3 break-all font-mono text-xs text-slate-400">{status.endpoint}</p>
              )}
              <p className="mt-3 text-xs text-slate-500">
                Checked {new Date(status.checked_at).toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-slate-950/35 p-4">
              <p className="text-sm font-medium text-white">Models listed by the gateway</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Catalog discovery confirms only that the gateway lists these IDs. It does not qualify a model for engineering work or test inference.
              </p>
              {status.models.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2" aria-label="Discovered model IDs">
                  {status.models.map((model) => (
                    <li key={model} className="rounded-full border border-cyan-200/20 bg-cyan-950/30 px-3 py-1 font-mono text-xs text-cyan-100">
                      {model}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-400">
                  {connected
                    ? 'The gateway is reachable but returned no models. Configure an upstream provider and model in agentgateway, then check again.'
                    : 'No model IDs can be discovered until the gateway is configured and reachable.'}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p aria-live="polite" className="text-sm text-slate-300">Checking the gateway connection…</p>
        )}

        <div className="grid gap-4 border-t border-white/10 pt-5 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-sm font-medium text-white">Connect an agentgateway instance</p>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-300">
              Set <code className="rounded bg-slate-900 px-1.5 py-0.5 text-cyan-100">AGENTGATEWAY_BASE_URL</code> on the FluxCore API service. If the gateway requires a virtual client key, set <code className="rounded bg-slate-900 px-1.5 py-0.5 text-cyan-100">AGENTGATEWAY_CLIENT_TOKEN</code> there too. Configure upstream provider credentials in agentgateway using its secret or environment-variable support; never paste provider keys into FluxCore.
            </p>
            <p className="mt-2 text-xs text-slate-400">The connection check reads only <code>/v1/models</code>; it does not send a billable prompt.</p>
          </div>
          <a
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-cyan-200/30 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-950/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
            href="https://agentgateway.dev/docs/standalone/latest/documentation/quickstart/llm/"
            rel="noreferrer"
            target="_blank"
          >
            Gateway setup guide <span aria-hidden="true" className="ml-2">↗</span>
          </a>
        </div>
      </section>
    </Card>
  );
}
