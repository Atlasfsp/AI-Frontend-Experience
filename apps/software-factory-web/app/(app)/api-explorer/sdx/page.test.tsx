import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SdxApiExplorerDetailPage from './page';

describe('SdxApiExplorerDetailPage', () => {
  it('renders the page header correctly', () => {
    render(<SdxApiExplorerDetailPage />);

    expect(screen.getByText('SDX contract explorer')).toBeTruthy();
    expect(
      screen.getByText(/Contract guide for the Software Factory backend surfaces/i)
    ).toBeTruthy();
  });

  it('renders the contract map data table with expected rows', () => {
    render(<SdxApiExplorerDetailPage />);

    expect(screen.getByText('SDX contract map')).toBeTruthy();
    expect(screen.getByText('Work item lifecycle')).toBeTruthy();
    expect(screen.getByText('Release artifacts and evidence')).toBeTruthy();
    expect(screen.getByText('Swagger / OpenAPI')).toBeTruthy();
  });

  it('renders the routing model code panel', () => {
    render(<SdxApiExplorerDetailPage />);

    expect(screen.getByText('Routing model')).toBeTruthy();
    expect(screen.getByText('BFF routing')).toBeTruthy();
    expect(screen.getByText('Guidance')).toBeTruthy();
  });
});
