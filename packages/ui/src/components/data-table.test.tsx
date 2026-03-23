import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DataTable } from './data-table';

describe('DataTable', () => {
  it('renders the empty state when there are no rows', () => {
    render(
      <DataTable
        title="API contracts"
        description="Contract ownership"
        rows={[]}
        columns={[
          {
            header: 'Name',
            render: (row: { id: string; name: string }) => row.name,
          },
        ]}
      />,
    );

    expect(screen.getByText('No rows available')).toBeTruthy();
    expect(
      screen.getByText('Connect a live data source or enable mock mode to populate this table.'),
    ).toBeTruthy();
  });
});
