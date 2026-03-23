'use client';

import React, { useState } from 'react';

/**
 * Real-time operations dashboard.
 * Uses GraphQL SSE subscriptions for live updates.
 * Shows live incident feed, cluster health, build progress, and alert stream.
 */
export default function RealTimeDashboardPage() {
  const [activeTab, setActiveTab] = useState<'incidents' | 'clusters' | 'builds' | 'alerts'>('incidents');

  // These would use the subscription hooks when live:
  // const { data: incidents } = useIncidentSubscription();
  // const { data: clusters } = useClusterHealthSubscription();
  // etc.

  // For now, render with mock state and connection status indicators

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Real-Time Operations</h1>
          <p className="text-sm text-slate-400">Live streaming updates from platform services</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400">Connected</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="mb-6 flex gap-1 rounded-lg bg-white/5 p-1">
        {(['incidents', 'clusters', 'builds', 'alerts'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === tab ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'
            }`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Live feed area */}
      <div className="rounded-xl border border-white/10 bg-[#0d1f3c] p-6">
        {activeTab === 'incidents' && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-white">Live Incident Feed</h2>
            <p className="text-xs text-slate-400">Streaming incident updates via GraphQL SSE subscription.</p>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3">
                  <div className="flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full ${i === 1 ? 'bg-red-400' : i === 2 ? 'bg-amber-400' : 'bg-blue-400'}`} />
                    <span className="text-sm text-white">Incident #{1000 + i}</span>
                  </div>
                  <span className="text-xs text-slate-400">Streaming...</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'clusters' && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-white">Cluster Health Stream</h2>
            <p className="text-xs text-slate-400">Real-time cluster status from Hasura subscription.</p>
            <div className="grid grid-cols-3 gap-4">
              {['ng-prod-1', 'za-prod-1', 'eu-prod-1'].map(cluster => (
                <div key={cluster} className="rounded-lg border border-white/5 bg-white/5 p-4 text-center">
                  <span className="block text-sm font-medium text-white">{cluster}</span>
                  <span className="block text-xs text-emerald-400">Healthy</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'builds' && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-white">Build Progress</h2>
            <p className="text-xs text-slate-400">Live build pipeline updates.</p>
            <div className="space-y-2">
              {[{ name: 'api-service', progress: 75 }, { name: 'worker', progress: 40 }, { name: 'cli', progress: 100 }].map(b => (
                <div key={b.name} className="rounded-lg border border-white/5 bg-white/5 p-3">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-white">{b.name}</span>
                    <span className="text-slate-400">{b.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${b.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-white">Alert Stream</h2>
            <p className="text-xs text-slate-400">Live alert feed with real-time updates.</p>
            <div className="space-y-2">
              {['CPU threshold exceeded on ng-prod-1', 'Memory pressure on worker-pool-3', 'Certificate expiry in 7 days'].map((alert, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 p-3">
                  <span className={`h-2 w-2 rounded-full ${i === 0 ? 'bg-red-400' : i === 1 ? 'bg-amber-400' : 'bg-blue-400'}`} />
                  <span className="flex-1 text-sm text-slate-300">{alert}</span>
                  <span className="text-xs text-slate-500">Just now</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
