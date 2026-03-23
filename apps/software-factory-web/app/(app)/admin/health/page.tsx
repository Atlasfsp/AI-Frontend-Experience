'use client';

import { useCallback, useEffect, useState } from 'react';

import { Badge, Card } from '@bac/ui';

interface UpstreamStatus {
  name: string;
  url: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs: number;
  error?: string;
  checkedAt: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  upstreams: UpstreamStatus[];
  checkedAt: string;
}

const STATUS_CONFIG = {
  healthy: { variant: 'success' as const, label: 'Healthy' },
  degraded: { variant: 'warning' as const, label: 'Degraded' },
  unhealthy: { variant: 'danger' as const, label: 'Unhealthy' },
} as const;

function StatusDot({ status }: { status: UpstreamStatus['status'] }) {
  const colorMap = {
    healthy: 'bg-emerald-400',
    degraded: 'bg-amber-400',
    unhealthy: 'bg-rose-400',
  } as const;

  return (
    <span
      className={`inline-block h-3 w-3 rounded-full ${colorMap[status]}`}
      aria-label={status}
    />
  );
}

export default function AdminHealthPage() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/health/upstream');

      if (!response.ok) {
        throw new Error(`Health check returned ${response.status}`);
      }

      const json: HealthResponse = await response.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();

    // Auto-refresh every 30 seconds.
    const interval = setInterval(fetchHealth, 30_000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Health Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Real-time status of upstream dependencies.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {data ? (
            <Badge variant={STATUS_CONFIG[data.status].variant}>
              {STATUS_CONFIG[data.status].label}
            </Badge>
          ) : null}
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error ? (
        <Card className="border-rose-400/30 bg-rose-500/10">
          <p className="text-sm text-rose-200">{error}</p>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.upstreams.map((upstream) => (
          <Card key={upstream.name}>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <StatusDot status={upstream.status} />
                  <h3 className="text-base font-semibold text-white">
                    {upstream.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 break-all">{upstream.url}</p>
              </div>
              <Badge variant={STATUS_CONFIG[upstream.status].variant}>
                {STATUS_CONFIG[upstream.status].label}
              </Badge>
            </div>

            <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Latency</span>
                <span
                  className={
                    upstream.latencyMs < 200
                      ? 'text-emerald-300'
                      : upstream.latencyMs < 1000
                        ? 'text-amber-300'
                        : 'text-rose-300'
                  }
                >
                  {upstream.latencyMs} ms
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Last Check</span>
                <span className="text-slate-200">
                  {new Date(upstream.checkedAt).toLocaleTimeString()}
                </span>
              </div>
              {upstream.error ? (
                <div className="mt-2 rounded border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                  {upstream.error}
                </div>
              ) : null}
            </div>
          </Card>
        ))}
      </div>

      {data ? (
        <p className="text-center text-xs text-slate-500">
          Last checked at {new Date(data.checkedAt).toLocaleString()}
        </p>
      ) : null}
    </div>
  );
}
