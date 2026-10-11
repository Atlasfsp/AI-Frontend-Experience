'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { FeatureFlags } from '@bac/config';
import { createFeatureFlags } from '@bac/config';
import { Badge, Card, DetailList, type DetailItem, StatGrid, type StatItem } from '@bac/ui';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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

interface ContractManifest {
  schemaVersion: string;
  repo: string;
  repoVersion: string;
  handoffArtifacts: Array<{ artifactId: string; version: string }>;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_VARIANT = {
  healthy: 'success',
  degraded: 'warning',
  unhealthy: 'danger',
} as const;

const STATUS_LABEL = {
  healthy: 'Healthy',
  degraded: 'Degraded',
  unhealthy: 'Unhealthy',
} as const;

const BUILD_VERSION =
  process.env.NEXT_PUBLIC_BAC_BUILD_VERSION ?? '0.0.0-local';
const BUILD_COMMIT =
  process.env.NEXT_PUBLIC_BAC_BUILD_COMMIT ?? 'unknown';
const BUILD_ENV =
  process.env.NEXT_PUBLIC_BAC_ENV ?? process.env.BAC_ENV ?? 'development';

/* ------------------------------------------------------------------ */
/*  StatusDot                                                          */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function AdminHealthPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contracts, setContracts] = useState<ContractManifest[]>([]);

  /* ---- Fetch health ------------------------------------------------ */

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/health/upstream');

      if (!response.ok) {
        throw new Error(`Health check returned ${response.status}`);
      }

      const json: HealthResponse = await response.json();
      setHealth(json);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch health status',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---- Fetch contract manifests ----------------------------------- */

  const fetchContracts = useCallback(async () => {
    try {
      const response = await fetch('/api/health/contracts');
      if (response.ok) {
        const json = (await response.json()) as ContractManifest[];
        setContracts(json);
      }
    } catch {
      // Contract info is best-effort; fail silently.
    }
  }, []);

  /* ---- Bootstrap -------------------------------------------------- */

  useEffect(() => {
    const bootstrap = setTimeout(() => {
      void fetchHealth();
      void fetchContracts();
    }, 0);

    const interval = setInterval(fetchHealth, 30_000);
    return () => {
      clearTimeout(bootstrap);
      clearInterval(interval);
    };
  }, [fetchHealth, fetchContracts]);

  /* ---- Feature flags ---------------------------------------------- */

  const featureFlags: FeatureFlags = useMemo(() => {
    const source: Record<string, string | undefined> = {};
    if (typeof process !== 'undefined') {
      const env = process.env as Record<string, string | undefined>;
      for (const key of Object.keys(env)) {
        if (key.startsWith('NEXT_PUBLIC_BAC_FEATURE_') || key.startsWith('NEXT_PUBLIC_BAC_ENABLE_')) {
          source[key] = env[key];
        }
      }
    }
    return createFeatureFlags(source);
  }, []);

  const flagEntries = Object.entries(featureFlags) as [
    keyof FeatureFlags,
    boolean,
  ][];
  const enabledFlagCount = flagEntries.filter(([, v]) => v).length;

  /* ---- Derived data ----------------------------------------------- */

  const overallStatus = health?.status ?? 'unhealthy';
  const healthyCount =
    health?.upstreams.filter((u) => u.status === 'healthy').length ?? 0;
  const totalUpstreams = health?.upstreams.length ?? 0;

  const designTokenVersion =
    contracts
      .flatMap((c) => c.handoffArtifacts)
      .find(
        (a) =>
          a.artifactId === 'figma-design-tokens-enterprise' ||
          a.artifactId === 'figma-design-tokens-consumer',
      )?.version ?? 'N/A';

  /* ---- Stat items ------------------------------------------------- */

  const statItems: StatItem[] = [
    {
      label: 'App Health',
      value: STATUS_LABEL[overallStatus],
      description: 'Overall application status.',
      status: STATUS_VARIANT[overallStatus],
    },
    {
      label: 'Upstreams',
      value: `${healthyCount}/${totalUpstreams}`,
      description: 'Healthy upstream dependencies.',
      status: healthyCount === totalUpstreams ? 'success' : 'warning',
    },
    {
      label: 'Feature Flags',
      value: `${enabledFlagCount}/${flagEntries.length}`,
      description: 'Currently enabled feature flags.',
      status: 'neutral',
    },
    {
      label: 'Environment',
      value: BUILD_ENV,
      description: `Version ${BUILD_VERSION}`,
      status: 'neutral',
    },
  ];

  /* ---- Build info detail items ------------------------------------ */

  const buildItems: DetailItem[] = [
    { label: 'Version', value: BUILD_VERSION, monospace: true },
    { label: 'Commit', value: BUILD_COMMIT, monospace: true },
    { label: 'Environment', value: BUILD_ENV },
    { label: 'Design Token Version', value: designTokenVersion, monospace: true },
  ];

  /* ---- Contract version detail items ------------------------------ */

  const contractItems: DetailItem[] = contracts.length
    ? contracts.map((c) => ({
        label: c.repo,
        value: c.repoVersion,
        hint: `Schema v${c.schemaVersion} -- ${c.handoffArtifacts.length} artifacts`,
        monospace: true,
      }))
    : [{ label: 'Contracts', value: 'No contract data available' }];

  /* ---- Feature flag detail items ---------------------------------- */

  const flagDetailItems: DetailItem[] = flagEntries.map(([name, enabled]) => ({
    label: name,
    value: (
      <Badge variant={enabled ? 'success' : 'danger'}>
        {enabled ? 'Enabled' : 'Disabled'}
      </Badge>
    ),
  }));

  /* ---- Render ----------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Health Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Real-time status of the application, upstream dependencies, and
            configuration.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {health ? (
            <Badge variant={STATUS_VARIANT[health.status]}>
              {STATUS_LABEL[health.status]}
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

      {/* Error banner */}
      {error ? (
        <Card className="border-rose-400/30 bg-rose-500/10">
          <p className="text-sm text-rose-200">{error}</p>
        </Card>
      ) : null}

      {/* Top-level stats */}
      <StatGrid items={statItems} />

      {/* Upstream connectivity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {health?.upstreams.map((upstream) => (
          <Card key={upstream.name}>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <StatusDot status={upstream.status} />
                  <h3 className="text-base font-semibold text-white">
                    {upstream.name}
                  </h3>
                </div>
                <p className="break-all text-xs text-slate-400">
                  {upstream.url}
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[upstream.status]}>
                {STATUS_LABEL[upstream.status]}
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

      {/* Build & token info */}
      <DetailList
        title="Build Information"
        description="Current build metadata and design token compatibility."
        items={buildItems}
      />

      {/* Contract versions */}
      <DetailList
        title="Contract Versions"
        description="Upstream contract manifests consumed by this application."
        items={contractItems}
      />

      {/* Feature flag summary */}
      <DetailList
        title="Feature Flag State"
        description={`${enabledFlagCount} of ${flagEntries.length} flags are currently enabled.`}
        items={flagDetailItems}
      />

      {/* Timestamp footer */}
      {health ? (
        <p className="text-center text-xs text-slate-500">
          Last checked at {new Date(health.checkedAt).toLocaleString()}
        </p>
      ) : null}
    </div>
  );
}
