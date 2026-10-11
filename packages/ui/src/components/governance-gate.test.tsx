import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { GovernanceGate } from './governance-gate';

function renderGate({
  mode = 'HOTL',
  onConfirm = vi.fn(),
}: {
  mode?: 'HOTL' | 'HITL' | 'FULL_AUTONOMY';
  onConfirm?: ReturnType<typeof vi.fn>;
} = {}) {
  render(
    <GovernanceGate
      actionDescription="A governed action"
      mode={mode}
      onConfirm={onConfirm}
      riskLevel="high"
    >
      {({ execute }) => <button onClick={execute}>Execute action</button>}
    </GovernanceGate>,
  );

  return onConfirm;
}

describe('GovernanceGate', () => {
  it('requires explicit confirmation in HOTL mode', async () => {
    const onConfirm = renderGate();

    fireEvent.click(screen.getByRole('button', { name: 'Execute action' }));

    expect(screen.getByRole('heading', { name: 'Confirm Action' })).toBeTruthy();
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });

  it('cancels a governed action without executing it', () => {
    const onConfirm = renderGate();

    fireEvent.click(screen.getByRole('button', { name: 'Execute action' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('heading', { name: 'Confirm Action' })).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('executes directly only when FULL_AUTONOMY is explicitly selected', async () => {
    const onConfirm = renderGate({ mode: 'FULL_AUTONOMY' });

    fireEvent.click(screen.getByRole('button', { name: 'Execute action' }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('heading', { name: 'Confirm Action' })).toBeNull();
  });
});
