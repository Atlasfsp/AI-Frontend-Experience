import type { Meta, StoryObj } from '@storybook/react';

import { Card } from './card';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    children: (
      <p className="text-sm text-slate-200">
        A basic card container used across the BAC operational surfaces.
      </p>
    ),
  },
};

export const WithHeader: Story = {
  render: () => (
    <Card>
      <div className="mb-4 border-b border-white/10 pb-4">
        <h3 className="text-lg font-semibold text-white">Service Health</h3>
        <p className="mt-1 text-xs text-slate-400">Last updated 30 seconds ago</p>
      </div>
      <div className="space-y-2 text-sm text-slate-200">
        <div className="flex items-center justify-between">
          <span>SDX API</span>
          <span className="text-emerald-400">Healthy</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Hasura</span>
          <span className="text-emerald-400">Healthy</span>
        </div>
        <div className="flex items-center justify-between">
          <span>SpiceDB</span>
          <span className="text-amber-400">Degraded</span>
        </div>
      </div>
    </Card>
  ),
};

export const WithActions: Story = {
  render: () => (
    <Card>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Deployment Summary</h3>
        <p className="mt-1 text-sm text-slate-300">
          3 services deployed across 2 regions.
        </p>
      </div>
      <div className="flex gap-3">
        <button className="rounded-full border border-cyan-300/40 bg-cyan-300/15 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-cyan-50 hover:bg-cyan-300/20">
          View Details
        </button>
        <button className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/12">
          Rollback
        </button>
      </div>
    </Card>
  ),
};

export const Compact: Story = {
  render: () => (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white">Build #1247</span>
        <span className="text-xs text-emerald-400">Passed</span>
      </div>
    </Card>
  ),
};
