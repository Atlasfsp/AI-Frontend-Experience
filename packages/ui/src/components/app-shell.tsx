'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';

import type { BacPermission, BacRole, BacSession } from '@bac/auth';
import { hasPermission } from '@bac/auth';

import { cn } from '../lib/cn';
import { Badge } from './badge';
import { CommandPalette } from './command-palette';
import type { CommandAction } from './command-palette';
import { WorkspaceSwitcher } from './workspace-switcher';
import type { WorkspaceOption } from './workspace-switcher';
import { useGovernanceMode } from '../hooks/use-governance-mode';

export interface NavigationItem {
  description: string;
  href: string;
  keywords?: string[];
  label: string;
  permission?: BacPermission;
}

export interface NavigationSection {
  items: NavigationItem[];
  title: string;
}

export function AppShell({
  children,
  navigation,
  productName,
  productTagline = 'Production-ready operator shell with shared UI, auth-aware routing, and fast navigation.',
  quickActions,
  session,
  workspaceOptions,
}: {
  children: React.ReactNode;
  navigation: NavigationSection[];
  productName: string;
  productTagline?: string;
  quickActions?: Array<{
    description: string;
    href: string;
    label: string;
  }>;
  session: Pick<BacSession, 'email' | 'name' | 'roles' | 'tenantId' | 'workspaceId'>;
  workspaceOptions?: WorkspaceOption[];
}) {
  const pathname = usePathname();
  const governanceMode = useGovernanceMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const filteredNavigation = useMemo(
    () =>
      navigation
        .map((section) => ({
          ...section,
          items: section.items.filter(
            (item) => !item.permission || hasPermission(session, item.permission),
          ),
        }))
        .filter((section) => section.items.length > 0),
    [navigation, session],
  );
  const commandActions = useMemo<CommandAction[]>(() => {
    const navActions = filteredNavigation.flatMap((section) =>
      section.items.map((item) => ({
        description: item.description,
        href: item.href,
        label: item.label,
        section: section.title,
        ...(item.keywords ? { keywords: item.keywords } : {}),
      })),
    );
    const shortcutActions =
      quickActions?.map((action) => ({
        ...action,
        keywords: ['quick action', action.label],
        section: 'Quick actions',
      })) ?? [];

    return [...shortcutActions, ...navActions];
  }, [filteredNavigation, quickActions]);
  const workspaceChoices = workspaceOptions ?? [
    {
      description: 'Current workspace context from the signed session cookie.',
      environment: 'Operator session',
      id: session.workspaceId,
      label: session.workspaceId,
      status: 'success',
      tenant: session.tenantId,
    },
  ];
  const breadcrumbs = pathname
    .split('/')
    .filter(Boolean)
    .slice(0, 4)
    .map((segment) =>
      segment
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase()),
    );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(21,184,166,0.18),_transparent_28%),linear-gradient(180deg,_var(--bac-color-background),_#050910_82%)] text-[var(--bac-color-text)]">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-slate-950"
      >
        Skip to content
      </a>
      <div className="mx-auto grid min-h-screen max-w-[1680px] lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-30 w-80 -translate-x-full border-r border-white/10 bg-slate-950/90 px-6 py-8 backdrop-blur transition lg:static lg:translate-x-0',
            mobileOpen && 'translate-x-0',
          )}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">
                BAC Control Plane
              </p>
              <h1 className="font-[var(--bac-font-display)] text-2xl font-semibold text-white">
                {productName}
              </h1>
              <p className="text-sm text-slate-300">{productTagline}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success">{session.tenantId}</Badge>
              <Badge variant="neutral">{session.workspaceId}</Badge>
              <span aria-label={`Governance mode: ${governanceMode}`}>
                <Badge variant="warning">{governanceMode}</Badge>
              </span>
              {session.roles.map((role: BacRole) => (
                <Badge key={role} variant="neutral">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
          <div className="mt-8">
            <WorkspaceSwitcher compact options={workspaceChoices} title="Workspace context" />
          </div>
          <nav className="mt-10 space-y-8">
            {filteredNavigation.map((section) => (
              <div key={section.title} className="space-y-3">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                  {section.title}
                </p>
                <div className="space-y-2">
                  {section.items.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'block rounded-2xl px-4 py-3 transition',
                          active
                            ? 'bg-cyan-400/12 text-white ring-1 ring-cyan-200/40'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white',
                        )}
                        onClick={() => setMobileOpen(false)}
                      >
                        <p className="font-medium">{item.label}</p>
                        <p className="mt-1 text-xs text-slate-400">{item.description}</p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <p className="font-medium text-white">{session.name}</p>
            <p>{session.email}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-cyan-100/75">
              {session.roles.join(' · ')}
            </p>
          </div>
        </aside>
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/65 px-4 py-4 backdrop-blur lg:px-8">
            <div className="grid gap-4 xl:grid-cols-[1fr_auto]">
              <div className="flex items-start gap-4">
                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white lg:hidden"
                  onClick={() => setMobileOpen((value) => !value)}
                  type="button"
                >
                  <span className="sr-only">Toggle navigation</span>
                  <span className="text-lg">{mobileOpen ? '×' : '≡'}</span>
                </button>
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                    Operational view
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
                    {breadcrumbs.length ? (
                      breadcrumbs.map((crumb) => (
                        <span
                          key={crumb}
                          className="rounded-full border border-white/10 px-3 py-1"
                        >
                          {crumb}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full border border-white/10 px-3 py-1">
                        Home
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3">
                <CommandPalette
                  actions={commandActions}
                  trigger={
                    <span className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 text-sm font-medium text-slate-100 transition hover:bg-white/10">
                      Open command palette
                      <span className="ml-3 rounded-full border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                        Cmd/Ctrl K
                      </span>
                    </span>
                  }
                />
                {(quickActions ?? commandActions.slice(0, 2)).slice(0, 2).map((action) => (
                  <Link
                    key={action.href}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
                    href={action.href}
                  >
                    {action.label}
                  </Link>
                ))}
                <Link
                  href="/logout"
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
                >
                  Sign out
                </Link>
              </div>
            </div>
          </header>
          <main id="content" className="flex-1 px-4 py-8 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
