import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SdxApiExplorerDetailPage from './page';

describe('SdxApiExplorerDetailPage', () => {
  it('renders the page header correctly', () => {
    render(<SdxApiExplorerDetailPage />);
    
    expect(screen.getByText('SDX contract explorer')).toBeInTheDocument();
    expect(
      screen.getByText(/Contract guide for the Software Factory backend surfaces/i)
    ).toBeInTheDocument();
  });

  it('renders the contract map data table with expected rows', () => {
    render(<SdxApiExplorerDetailPage />);
    
    // Check if the DataTable title is present
    expect(screen.getByText('SDX contract map')).toBeInTheDocument();
    
    // Check for some known contracts from the static data
    expect(screen.getByText('Work item lifecycle')).toBeInTheDocument();
    expect(screen.getByText('Release artifacts and evidence')).toBeInTheDocument();
    expect(screen.getByText('Swagger / OpenAPI')).toBeInTheDocument();
  });

  it('renders the routing model code panel', () => {
    render(<SdxApiExplorerDetailPage />);
    
    expect(screen.getByText('Routing model')).toBeInTheDocument();
    // The tabs should be rendered
    expect(screen.getByText('BFF routing')).toBeInTheDocument();
    expect(screen.getByText('Guidance')).toBeInTheDocument();
  });
});
