import type { Meta, StoryObj } from '@storybook/react';

import type { Column } from './data-table';
import { DataTable } from './data-table';

interface SampleRow {
  id: string;
  name: string;
  status: string;
  region: string;
  updatedAt: string;
}

const sampleColumns: Column<SampleRow>[] = [
  { header: 'Name', render: (row) => <span className="font-medium text-white">{row.name}</span> },
  {
    header: 'Status',
    render: (row) => (
      <span
        className={
          row.status === 'Running'
            ? 'text-emerald-400'
            : row.status === 'Degraded'
              ? 'text-amber-400'
              : 'text-rose-400'
        }
      >
        {row.status}
      </span>
    ),
  },
  { header: 'Region', render: (row) => row.region },
  { header: 'Updated', render: (row) => row.updatedAt },
];

const sampleRows: SampleRow[] = [
  { id: '1', name: 'sdx-api', status: 'Running', region: 'ng-west-1', updatedAt: '2 min ago' },
  { id: '2', name: 'hasura-gw', status: 'Running', region: 'ng-west-1', updatedAt: '5 min ago' },
  { id: '3', name: 'spicedb', status: 'Degraded', region: 'za-south-1', updatedAt: '1 min ago' },
  { id: '4', name: 'authentik', status: 'Running', region: 'eu-west-1', updatedAt: '8 min ago' },
  { id: '5', name: 'nats-bus', status: 'Stopped', region: 'ng-west-1', updatedAt: '15 min ago' },
];

const meta: Meta<typeof DataTable> = {
  title: 'Components/DataTable',
  component: DataTable,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DataTable<SampleRow>>;

export const Default: Story = {
  args: {
    title: 'Active Services',
    description: 'Current status of all deployed services across regions.',
    columns: sampleColumns,
    rows: sampleRows,
  },
};

export const Empty: Story = {
  args: {
    title: 'Active Services',
    description: 'No services deployed yet.',
    columns: sampleColumns,
    rows: [],
    emptyTitle: 'No services found',
    emptyDescription: 'Deploy a service to see it listed here.',
  },
};

export const Loading: Story = {
  name: 'Loading',
  render: () => (
    <div className="animate-pulse">
      <DataTable
        title="Active Services"
        columns={sampleColumns}
        rows={[]}
        emptyTitle="Loading..."
        emptyDescription="Fetching service data from upstream APIs."
      />
    </div>
  ),
};

export const WithFooter: Story = {
  args: {
    title: 'Build History',
    columns: sampleColumns,
    rows: sampleRows.slice(0, 3),
    footer: (
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Showing 3 of 128 results</span>
        <button className="text-cyan-300 hover:underline">View all</button>
      </div>
    ),
  },
};
