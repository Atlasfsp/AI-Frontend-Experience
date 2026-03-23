'use client';

import React, { useEffect, useState } from 'react';

interface RepoHealth {
  name: string;
  layer: 'design' | 'backend' | 'experience';
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  lastRelease: string;
  contractVersion: string;
  ciStatus: 'passing' | 'failing' | 'unknown';
}

const REPOS: RepoHealth[] = [
  { name: 'AI-Software-Factory', layer: 'backend', status: 'healthy', lastRelease: 'v1.0.0', contractVersion: '1.0.0', ciStatus: 'passing' },
  { name: 'AI-Platform-Automation', layer: 'backend', status: 'healthy', lastRelease: 'v1.0.0', contractVersion: '1.0.0', ciStatus: 'passing' },
  { name: 'Design-Factory_Stitch', layer: 'design', status: 'healthy', lastRelease: 'v1.0.0', contractVersion: '1.0.0', ciStatus: 'passing' },
  { name: 'Design-Factory_Figma', layer: 'design', status: 'healthy', lastRelease: 'v1.0.0', contractVersion: '1.0.0', ciStatus: 'passing' },
  { name: 'AI-Frontend-Experience', layer: 'experience', status: 'healthy', lastRelease: 'v0.1.0', contractVersion: '1.0.0', ciStatus: 'passing' },
  { name: 'AI-Companion-Mobile', layer: 'experience', status: 'healthy', lastRelease: 'v0.1.0', contractVersion: '1.0.0', ciStatus: 'passing' },
];

export default function EcosystemHealthPage() {
  const [repos, setRepos] = useState(REPOS);
  const [lastRefresh, setLastRefresh] = useState(new Date().toISOString());

  const layerColors = { design: 'text-purple-400', backend: 'text-amber-400', experience: 'text-cyan-400' };
  const statusColors = { healthy: 'bg-emerald-400', degraded: 'bg-amber-400', down: 'bg-red-400', unknown: 'bg-slate-400' };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ecosystem Health</h1>
          <p className="text-sm text-slate-400">Health status of all 6 repositories across 3 layers</p>
        </div>
        <div className="text-xs text-slate-500">Last refresh: {new Date(lastRefresh).toLocaleTimeString()}</div>
      </div>

      {/* Layer summary cards */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {(['design', 'backend', 'experience'] as const).map(layer => {
          const layerRepos = repos.filter(r => r.layer === layer);
          const allHealthy = layerRepos.every(r => r.status === 'healthy');
          return (
            <div key={layer} className="rounded-xl border border-white/10 bg-[#0d1f3c] p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${allHealthy ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span className={`text-sm font-semibold uppercase tracking-wider ${layerColors[layer]}`}>{layer} Layer</span>
              </div>
              <p className="text-xs text-slate-400">{layerRepos.length} repos · {allHealthy ? 'All healthy' : 'Issues detected'}</p>
            </div>
          );
        })}
      </div>

      {/* Repo table */}
      <div className="rounded-xl border border-white/10 bg-[#0d1f3c]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Repository</th>
              <th className="px-4 py-3">Layer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last Release</th>
              <th className="px-4 py-3">Contract Version</th>
              <th className="px-4 py-3">CI</th>
            </tr>
          </thead>
          <tbody>
            {repos.map(repo => (
              <tr key={repo.name} className="border-b border-white/5">
                <td className="px-4 py-3 text-sm font-medium text-white">{repo.name}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium uppercase ${layerColors[repo.layer]}`}>{repo.layer}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${statusColors[repo.status]}`} />
                    <span className="text-xs text-slate-300">{repo.status}</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">{repo.lastRelease}</td>
                <td className="px-4 py-3 text-xs text-slate-400">{repo.contractVersion}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    repo.ciStatus === 'passing' ? 'bg-emerald-500/20 text-emerald-400' :
                    repo.ciStatus === 'failing' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'
                  }`}>{repo.ciStatus}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
