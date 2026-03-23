import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { DocEntry } from '@/lib/docs-catalog';

import { DocsSearchPanel } from './docs-search-panel';

const MOCK_ENTRIES: DocEntry[] = [
  {
    id: '1',
    href: '/docs/1',
    title: 'Authentication Guide',
    summary: 'How to setup authentik SSO',
    kind: 'guide',
    section: 'operations',
    owner: 'Platform Team',
    readTime: '5 min',
    keywords: ['login', 'sso', 'oidc'],
    audience: ['developers'],
  },
  {
    id: '2',
    href: '/docs/2',
    title: 'Deploying Clusters',
    summary: 'GitOps instructions for spinning up new tenant clusters',
    kind: 'runbook',
    section: 'operations',
    owner: 'SRE Team',
    readTime: '10 min',
    keywords: ['kubernetes', 'argo'],
    audience: ['operators'],
  },
];

describe('DocsSearchPanel', () => {
  it('renders the empty state when no entries match', () => {
    render(<DocsSearchPanel entries={MOCK_ENTRIES} initialQuery="NonExistentQuery" />);

    expect(screen.getByText('No matching documents')).toBeTruthy();
    expect(screen.queryByText('Authentication Guide')).toBeNull();
  });

  it('renders all entries when query is empty', () => {
    render(<DocsSearchPanel entries={MOCK_ENTRIES} />);

    expect(screen.getByText('Authentication Guide')).toBeTruthy();
    expect(screen.getByText('Deploying Clusters')).toBeTruthy();
    expect(screen.getByText('2 results across the docs portal')).toBeTruthy();
  });

  it('filters entries by title', () => {
    render(<DocsSearchPanel entries={MOCK_ENTRIES} />);

    const input = screen.getByRole('textbox', { name: /search documentation/i });
    fireEvent.change(input, { target: { value: 'authentication' } });

    expect(screen.getByText('Authentication Guide')).toBeTruthy();
    expect(screen.queryByText('Deploying Clusters')).toBeNull();
    expect(screen.getByText('1 result for “authentication”')).toBeTruthy();
  });

  it('filters entries by keywords', () => {
    render(<DocsSearchPanel entries={MOCK_ENTRIES} />);

    const input = screen.getByRole('textbox', { name: /search documentation/i });
    fireEvent.change(input, { target: { value: 'argo' } });

    expect(screen.getByText('Deploying Clusters')).toBeTruthy();
    expect(screen.queryByText('Authentication Guide')).toBeNull();
  });
});
