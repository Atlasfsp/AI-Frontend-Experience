import type { Meta, StoryObj } from '@storybook/react';

import { Badge } from './badge';

const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['neutral', 'success', 'warning', 'danger'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: 'Default',
    variant: 'neutral',
  },
};

export const Success: Story = {
  args: {
    children: 'Healthy',
    variant: 'success',
  },
};

export const Warning: Story = {
  args: {
    children: 'Degraded',
    variant: 'warning',
  },
};

export const Danger: Story = {
  args: {
    children: 'Critical',
    variant: 'danger',
  },
};

export const Info: Story = {
  name: 'Info (Neutral)',
  args: {
    children: 'Pending',
    variant: 'neutral',
  },
};

export const AllVariants: Story = {
  name: 'All Variants',
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="neutral">Neutral</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Danger</Badge>
    </div>
  ),
};
