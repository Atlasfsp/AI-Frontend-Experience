import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SdxApiExplorerDetailPage from './page';

describe('SdxApiExplorerDetailPage', () => {
  it('renders the page header correctly', () => {
    render(<SdxApiExplorerDetailPage />);

    expect(screen.getByText('FluxCore API coverage')).toBeTruthy();
    expect(screen.getByText(/Verified local backend routes and their intended frontend consumers/i)).toBeTruthy();
  });

  it('renders the contract map data table with expected rows', () => {
    render(<SdxApiExplorerDetailPage />);

    expect(screen.getByText('Canonical backend surfaces')).toBeTruthy();
    expect(screen.getByText('Shared project and SME staffing')).toBeTruthy();
    expect(screen.getByText('Governance, evidence, release promotion, and evaluation')).toBeTruthy();
    expect(screen.getByText('Activation, frontend providers, and workforce routing')).toBeTruthy();
  });

  it('renders the routing model code panel', () => {
    render(<SdxApiExplorerDetailPage />);

    expect(screen.getByText('Routing model')).toBeTruthy();
    expect(screen.getByText('BFF routing')).toBeTruthy();
    expect(screen.getByText('Implementation rules')).toBeTruthy();
    expect(screen.getByText('Frontend coverage gaps')).toBeTruthy();
    expect(screen.getByText(/These paths are not registered by the Go API/)).toBeTruthy();
  });
});
