'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { FeatureFlags } from '@bac/config';
import { createFeatureFlags } from '@bac/config';
import { Badge, Card, DataTable, type Column } from '@bac/ui';

/* ------------------------------------------------------------------ */
/*  Flag metadata registry                                             */
/* ------------------------------------------------------------------ */

interface FlagMeta {
  id: string;
  name: keyof FeatureFlags;
  envVar: string;
  description: string;
  defaultValue: boolean;
  /** Environments where this flag is typically enabled. */
  enabledIn: string[];
}

const FLAG_REGISTRY: FlagMeta[] = [
  {
    id: 'graphiqlExplorer',
    name: 'graphiqlExplorer',
    envVar: 'NEXT_PUBLIC_BAC_FEATURE_GRAPHIQL',
    description: 'Enable the GraphiQL interactive API explorer.',
    defaultValue: true,
    enabledIn: ['development', 'staging'],
  },
  {
    id: 'swaggerExplorer',
    name: 'swaggerExplorer',
    envVar: 'NEXT_PUBLIC_BAC_FEATURE_SWAGGER',
    description: 'Enable the Swagger / OpenAPI explorer UI.',
    defaultValue: true,
    enabledIn: ['development', 'staging'],
  },
  {
    id: 'mockApi',
    name: 'mockApi',
    envVar: 'NEXT_PUBLIC_BAC_ENABLE_MOCK_API',
    description: 'Use mock API responses instead of live backends.',
    defaultValue: true,
    enabledIn: ['development', 'test'],
  },
  {
    id: 'auditTrail',
    name: 'auditTrail',
    envVar: 'NEXT_PUBLIC_BAC_FEATURE_AUDIT_TRAIL',
    description: 'Enable audit trail logging and viewer.',
    defaultValue: true,
    enabledIn: ['development', 'staging', 'production'],
  },
  {
    id: 'liveSubscriptions',
    name: 'liveSubscriptions',
    envVar: 'NEXT_PUBLIC_BAC_FEATURE_LIVE_SUBSCRIPTIONS',
    description: 'Enable real-time GraphQL subscriptions via WebSocket.',
    defaultValue: true,
    enabledIn: ['development', 'staging', 'production'],
  },
  {
    id: 'oidcLogin',
    name: 'oidcLogin',
    envVar: 'NEXT_PUBLIC_BAC_FEATURE_OIDC_LOGIN',
    description: 'Enable OIDC / Authentik login flow.',
    defaultValue: true,
    enabledIn: ['development', 'staging', 'production'],
  },
  {
    id: 'previewDeploys',
    name: 'previewDeploys',
    envVar: 'NEXT_PUBLIC_BAC_FEATURE_PREVIEW_DEPLOYS',
    description: 'Enable preview deploy workflows.',
    defaultValue: true,
    enabledIn: ['development', 'staging'],
  },
];

const STORAGE_KEY = 'bac:feature-flag-overrides';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function loadOverrides(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function saveOverrides(overrides: Record<string, boolean>) {
  if (typeof window === 'undefined') return;
  if (Object.keys(overrides).length === 0) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  }
}

function resolveEnvironment(): string {
  if (typeof window === 'undefined') return 'production';
  const env =
    (process.env.NEXT_PUBLIC_BAC_ENV as string | undefined) ??
    (process.env.BAC_ENV as string | undefined) ??
    'development';
  return env;
}

/* ------------------------------------------------------------------ */
/*  Row type for the DataTable                                         */
/* ------------------------------------------------------------------ */

interface FlagRow {
  id: string;
  name: string;
  envVar: string;
  description: string;
  currentValue: boolean;
  overridden: boolean;
  enabledIn: string[];
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function FeatureFlagsAdminPage() {
  const environment = useMemo(resolveEnvironment, []);
  const isDev = environment === 'development' || environment === 'staging';

  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  // Load overrides from localStorage on mount.
  useEffect(() => {
    setOverrides(loadOverrides());
  }, []);

  // Resolve current flag values using the same logic as @bac/config.
  const resolvedFlags = useMemo(() => {
    // Build a source map that includes localStorage overrides in dev.
    const source: Record<string, string | undefined> = {};

    // In the browser, env vars prefixed with NEXT_PUBLIC_ are available.
    for (const flag of FLAG_REGISTRY) {
      const envValue =
        typeof process !== 'undefined'
          ? (process.env as Record<string, string | undefined>)[flag.envVar]
          : undefined;
      if (envValue !== undefined) {
        source[flag.envVar] = envValue;
      }
    }

    // Apply localStorage overrides (dev only).
    if (isDev) {
      for (const [flagName, value] of Object.entries(overrides)) {
        const meta = FLAG_REGISTRY.find((f) => f.name === flagName);
        if (meta) {
          source[meta.envVar] = String(value);
        }
      }
    }

    return createFeatureFlags(source);
  }, [overrides, isDev]);

  const handleToggle = useCallback(
    (flagName: string) => {
      if (!isDev) return;

      setOverrides((prev) => {
        const currentValue =
          resolvedFlags[flagName as keyof FeatureFlags] ?? false;
        const next = { ...prev, [flagName]: !currentValue };

        // If the override matches the env value, remove it.
        const meta = FLAG_REGISTRY.find((f) => f.name === flagName);
        if (meta) {
          const envValue =
            typeof process !== 'undefined'
              ? (process.env as Record<string, string | undefined>)[
                  meta.envVar
                ]
              : undefined;
          const envBool =
            envValue === undefined ? meta.defaultValue : envValue === 'true';
          if (next[flagName] === envBool) {
            delete next[flagName];
          }
        }

        saveOverrides(next);
        return next;
      });
    },
    [isDev, resolvedFlags],
  );

  const handleClearOverrides = useCallback(() => {
    setOverrides({});
    saveOverrides({});
  }, []);

  // Build table rows.
  const rows: FlagRow[] = useMemo(
    () =>
      FLAG_REGISTRY.map((meta) => ({
        id: meta.id,
        name: meta.name,
        envVar: meta.envVar,
        description: meta.description,
        currentValue: resolvedFlags[meta.name],
        overridden: meta.name in overrides,
        enabledIn: meta.enabledIn,
      })),
    [resolvedFlags, overrides],
  );

  const enabledCount = rows.filter((r) => r.currentValue).length;
  const overriddenCount = rows.filter((r) => r.overridden).length;

  const columns: Column<FlagRow>[] = useMemo(
    () => [
      {
        header: 'Flag',
        render: (row) => (
          <div className="space-y-1">
            <p className="font-semibold text-white">{row.name}</p>
            <p className="text-xs text-slate-400">{row.description}</p>
          </div>
        ),
      },
      {
        header: 'Value',
        className: 'px-6 py-4 align-middle',
        render: (row) => (
          <div className="flex items-center gap-2">
            <Badge variant={row.currentValue ? 'success' : 'danger'}>
              {row.currentValue ? 'Enabled' : 'Disabled'}
            </Badge>
            {row.overridden ? (
              <Badge variant="warning">Override</Badge>
            ) : null}
          </div>
        ),
      },
      {
        header: 'Env Source',
        render: (row) => (
          <code className="rounded bg-white/5 px-2 py-1 font-mono text-xs text-slate-300">
            {row.envVar}
          </code>
        ),
      },
      {
        header: 'Environments',
        render: (row) => (
          <div className="flex flex-wrap gap-1">
            {row.enabledIn.map((env) => (
              <Badge key={env} variant="neutral">
                {env}
              </Badge>
            ))}
          </div>
        ),
      },
      ...(isDev
        ? [
            {
              header: 'Toggle',
              className: 'px-6 py-4 align-middle text-center',
              render: (row: FlagRow) => (
                <button
                  type="button"
                  onClick={() => handleToggle(row.name)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/50 ${
                    row.currentValue ? 'bg-emerald-500' : 'bg-slate-600'
                  }`}
                  aria-label={`Toggle ${row.name}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      row.currentValue ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              ),
            } satisfies Column<FlagRow>,
          ]
        : []),
    ],
    [isDev, handleToggle],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Feature Flags</h1>
          <p className="mt-1 text-sm text-slate-400">
            {isDev
              ? 'Development mode -- flags can be toggled via localStorage overrides.'
              : 'Production mode -- flags are read-only.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="neutral">{environment}</Badge>
          <Badge variant="success">
            {enabledCount}/{rows.length} enabled
          </Badge>
          {overriddenCount > 0 ? (
            <Badge variant="warning">{overriddenCount} overridden</Badge>
          ) : null}
        </div>
      </div>

      {/* Override notice */}
      {isDev && overriddenCount > 0 ? (
        <Card className="flex items-center justify-between border-amber-400/30 bg-amber-500/10">
          <p className="text-sm text-amber-200">
            {overriddenCount} flag{overriddenCount > 1 ? 's' : ''} overridden
            via localStorage. These overrides persist across page reloads.
          </p>
          <button
            type="button"
            onClick={handleClearOverrides}
            className="rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-200 transition hover:bg-amber-500/20"
          >
            Clear all overrides
          </button>
        </Card>
      ) : null}

      {/* Flag table */}
      <DataTable
        title="All Feature Flags"
        description="Feature flags control which capabilities are available in the application."
        columns={columns}
        rows={rows}
        emptyTitle="No flags registered"
        emptyDescription="No feature flags are configured in this application."
      />
    </div>
  );
}
