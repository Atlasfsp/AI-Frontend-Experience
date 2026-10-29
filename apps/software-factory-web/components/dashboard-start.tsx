'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const examples = [
  {
    label: 'A booking app',
    idea: 'Build an appointments app where customers can choose a service, see available times, and receive a confirmation.',
  },
  {
    label: 'A team workspace',
    idea: 'Create a simple team workspace to organize tasks, share updates, and see what needs attention next.',
  },
  {
    label: 'An online store',
    idea: 'Make an online store where people can browse products, save favorites, and place an order.',
  },
];

export function DashboardStart() {
  const [idea, setIdea] = useState('');

  return (
    <section
      aria-labelledby="dashboard-start-heading"
      className="relative isolate overflow-hidden rounded-[28px] border border-cyan-200/20 bg-gradient-to-br from-cyan-300/[0.10] via-slate-950/90 to-slate-900/90 p-5 shadow-2xl shadow-black/20 sm:p-8 lg:p-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-28 -z-10 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl"
      />
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">
          FluxCore Create · no coding required
        </p>
        <h2
          id="dashboard-start-heading"
          className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl"
        >
          What would you like to build?
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
          Start with a rough idea. You can clarify it with FluxCore before you
          create the shared project and review its proposed SME team.
        </p>

        <form
          action="/software-factory/prd-intake"
          className="mt-7 space-y-4"
          method="get"
        >
          <label className="sr-only" htmlFor="dashboard-idea">
            Describe your idea
          </label>
          <textarea
            id="dashboard-idea"
            name="idea"
            className="min-h-32 w-full resize-y rounded-2xl border border-white/15 bg-slate-950/80 p-4 text-base leading-7 text-white placeholder:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 sm:min-h-36 sm:p-5"
            maxLength={12000}
            onChange={(event) => setIdea(event.target.value)}
            placeholder="For example: Help local farmers sell fresh produce directly to nearby restaurants…"
            value={idea}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-slate-400">
              A sentence is enough to get started. Add technical details later.
            </p>
            <button
              className="min-h-12 shrink-0 rounded-2xl bg-[var(--bac-color-primary)] px-6 py-3 font-semibold text-white shadow-lg shadow-cyan-950/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
              disabled={idea.trim().length < 5}
              type="submit"
            >
              Continue to Create <span aria-hidden="true">→</span>
            </button>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap items-center gap-2" aria-label="Idea examples">
          <span className="mr-1 text-xs font-semibold text-slate-400">
            Try an example
          </span>
          {examples.map((example) => (
            <button
              key={example.label}
              className="min-h-10 rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-200/40 hover:bg-cyan-200/[0.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
              onClick={() => setIdea(example.idea)}
              type="button"
            >
              {example.label}
            </button>
          ))}
        </div>

        <div className="mt-7 flex flex-col gap-3 border-t border-white/10 pt-5 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="leading-6 text-slate-300">
            Already have a codebase or want hands-on tools?
          </p>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-violet-200/30 bg-violet-200/[0.07] px-4 font-semibold text-violet-100 transition hover:bg-violet-200/[0.12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-300"
            href="/software-factory/workspaces"
          >
            Open FluxCore Engineer
            <span aria-hidden="true" className="ml-2">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
