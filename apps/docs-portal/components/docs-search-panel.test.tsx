import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DocsSearchPanel } from './docs-search-panel';

const MOCK_ENTRIES = [
  {
    id: '1',
    href: '/docs/1',
    title: 'Authentication Guide',
    summary: 'How to setup authentik SSO',
    kind: 'Guide',
    section: 'Setup',
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
    kind: 'Runbook',
    section: 'Operations',
    owner: 'SRE Team',
    readTime: '10 min',
    keywords: ['kubernetes', 'argo'],
    audience: ['operators'],
  },
];

describe('DocsSearchPanel', () => {
  it('renders the empty state when no entries match', () => {
    render(<DocsSearchPanel entries={MOCK_ENTRIES} initialQuery="NonExistentQuery" />);
    
    expect(screen.getByText('No matching documents')).toBeInTheDocument();
    expect(screen.queryByText('Authentication Guide')).not.toBeInTheDocument();
  });

  it('renders all entries when query is empty', () => {
    render(<DocsSearchPanel entries={MOCK_ENTRIES} />);
    
    expect(screen.getByText('Authentication Guide')).toBeInTheDocument();
    expect(screen.getByText('Deploying Clusters')).toBeInTheDocument();
    expect(screen.getByText('2 results across the docs portal')).toBeInTheDocument();
  });

  it('filters entries by title', () => {
    render(<DocsSearchPanel entries={MOCK_ENTRIES} />);
    
    const input = screen.getByRole('textbox', { name: /search documentation/i });
    fireEvent.change(input, { target: { value: 'authentication' } });
    
    expect(screen.getByText('Authentication Guide')).toBeInTheDocument();
    expect(screen.queryByText('Deploying Clusters')).not.toBeInTheDocument();
    expect(screen.getByText('1 result for “authentication”')).toBeInTheDocument();
  });

  it('filters entries by keywords', () => {
    render(<DocsSearchPanel entries={MOCK_ENTRIES} />);
    
    const input = screen.getByRole('textbox', { name: /search documentation/i });
    fireEvent.change(input, { target: { value: 'argo' } });
    
    expect(screen.getByText('Deploying Clusters')).toBeInTheDocument();
    expect(screen.queryByText('Authentication Guide')).not.toBeInTheDocument();
  });
});
