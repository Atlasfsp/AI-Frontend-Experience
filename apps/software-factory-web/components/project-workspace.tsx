'use client';

import Link from 'next/link';
import React from 'react';
import { useEffect, useMemo, useState } from 'react';

import type { SharedEngineeringProject } from '@/features/projects';

type IterationDraft = {
  id: string;
  prompt: string;
  createdAt: string;
};

function storageKey(projectId: string) {
  return `fluxcore:workspace-iterations:v1:${projectId}`;
}

function readDrafts(value: string | null): IterationDraft[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is IterationDraft =>
        !!item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.prompt === 'string' &&
        typeof item.createdAt === 'string',
    );
  } catch {
    return [];
  }
}

function starterPrompt(project: SharedEngineeringProject) {
  return `For ${project.name}, ${project.outcome}\n\nPlease first inspect the existing repository and summarize the relevant files, current behavior, and a small implementation plan. Do not change files until I approve the plan.`;
}

export function ProjectWorkspace({ project }: { project: SharedEngineeringProject }) {
  const key = useMemo(() => storageKey(project.id), [project.id]);
  const [prompt, setPrompt] = useState('');
  const [drafts, setDrafts] = useState<IterationDraft[]>([]);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setDrafts(readDrafts(window.localStorage.getItem(key)));
    setReady(true);
  }, [key]);

  function saveDraft() {
    const text = prompt.trim();
    if (text.length < 5) return;
    const next = [
      { id: crypto.randomUUID(), prompt: text, createdAt: new Date().toISOString() },
      ...drafts,
    ].slice(0, 25);
    window.localStorage.setItem(key, JSON.stringify(next));
    setDrafts(next);
    setNotice('Iteration draft saved in this browser. It has not been sent to an agent.');
  }

  async function copyPrompt() {
    if (!prompt.trim()) return;
    await navigator.clipboard.writeText(prompt.trim());
    setNotice('Workspace prompt copied. No repository or agent was contacted.');
  }

  function loadDraft(draft: IterationDraft) {
    setPrompt(draft.prompt);
    setNotice('Draft loaded into the composer.');
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)]">
      <section className="space-y-5" aria-label="Project iteration workspace">
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Workspace context</p>
              <h2 className="mt-2 text-lg font-semibold text-white">Product intent</h2>
            </div>
            <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">{project.status}</span>
          </div>
          <p className="mt-4 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-slate-200">{project.outcome}</p>
          <dl className="mt-5 grid gap-4 border-t border-white/10 pt-4 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-400">Product area</dt><dd className="mt-1 text-white">{project.applicationDomain}</dd></div>
            <div><dt className="text-slate-400">Application SME</dt><dd className="mt-1 text-white">{project.workforcePlan.expert?.name ?? 'Not available'}</dd></div>
            <div className="sm:col-span-2"><dt className="text-slate-400">Repository</dt><dd className="mt-1 break-all font-mono text-xs text-slate-200">{project.repositoryRef || 'No repository connected'}</dd></div>
          </dl>
        </div>

        <div className="rounded-3xl border border-cyan-200/20 bg-gradient-to-br from-cyan-300/[0.07] to-slate-950/80 p-5 sm:p-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Iteration composer</p>
            <h2 className="mt-2 text-xl font-semibold text-white">What should change next?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">The project intent is included in your prompt. Save it as a private local draft or copy it to continue in your connected coding tool.</p>
          </div>
          <label className="sr-only" htmlFor="workspace-iteration">Describe the next iteration</label>
          <textarea
            id="workspace-iteration"
            className="mt-5 min-h-40 w-full resize-y rounded-2xl border border-white/15 bg-slate-950/80 p-4 text-sm leading-6 text-white placeholder:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
            maxLength={12000}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Describe a change, bug fix, or question about this project…"
            value={prompt}
          />
          <button
            className="mt-3 text-left text-xs font-semibold text-cyan-200 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
            onClick={() => setPrompt(starterPrompt(project))}
            type="button"
          >
            Use a safe, repo-first starter prompt
          </button>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className="min-h-11 rounded-xl bg-[var(--bac-color-primary)] px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300" disabled={!ready || prompt.trim().length < 5} onClick={saveDraft} type="button">Save local draft</button>
            <button className="min-h-11 rounded-xl border border-white/15 px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300" disabled={prompt.trim().length < 5} onClick={() => void copyPrompt()} type="button">Copy project prompt</button>
          </div>
          <p aria-live="polite" className="mt-3 min-h-5 text-xs text-cyan-100">{notice}</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">Agent dispatch, code changes, branch creation, and review submission are unavailable until a Git provider and governed workspace execution API are connected.</p>
        </div>

        <section aria-labelledby="iteration-history-heading" className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Iteration history</p><h2 id="iteration-history-heading" className="mt-2 text-lg font-semibold text-white">Your drafts</h2></div>
            <span className="text-xs text-slate-400">This browser only</span>
          </div>
          {!ready ? <p className="mt-4 text-sm text-slate-400">Loading local drafts…</p> : drafts.length ? (
            <ul className="mt-4 space-y-3">
              {drafts.map((draft) => <li key={draft.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-200">{draft.prompt}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400"><time dateTime={draft.createdAt}>{new Date(draft.createdAt).toLocaleString()}</time><button className="font-semibold text-cyan-200 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300" onClick={() => loadDraft(draft)} type="button">Continue this draft</button></div>
              </li>)}
            </ul>
          ) : <p className="mt-4 text-sm text-slate-400">No drafts yet. Iterations you save here stay on this device and are not shared with the project team.</p>}
        </section>
      </section>

      <aside className="space-y-4" aria-label="Workspace tools and connection status">
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-200">Engineer console</p>
          <h2 className="mt-2 text-lg font-semibold text-white">Project controls</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Your shared project is ready for design context, repository work, agent runs, review, and deployment as those governed connections are enabled.</p>
          <div className="mt-4 space-y-2">
            <Link className="block rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-100 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300" href="/software-factory/settings/frontend-providers">Design and code providers <span className="text-amber-200">· not connected</span></Link>
            <Link className="block rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-100 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300" href="/software-factory/code-review">Code review <span className="text-amber-200">· unavailable</span></Link>
          </div>
        </div>
        <div role="status" className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.05] p-5">
          <h2 className="text-sm font-semibold text-amber-100">Git workspace not connected</h2>
          <p className="mt-2 text-sm leading-6 text-amber-50/80">This project has no verified Git remote, checked-out commit, or provider account. FluxCore will not claim to inspect or modify source until that connection is available.</p>
          <p className="mt-3 text-xs text-amber-100/70">Project {project.id} · version {project.version}</p>
        </div>
      </aside>
    </div>
  );
}
