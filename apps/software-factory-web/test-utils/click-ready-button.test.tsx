import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { clickReadyButton } from './click-ready-button';

it('waits for a disabled control instead of silently dropping the action', async () => {
  const onClick = vi.fn();
  const view = render(<button disabled onClick={onClick}>Propose team</button>);
  const action = clickReadyButton('Propose team');
  expect(onClick).not.toHaveBeenCalled();
  view.rerender(<button onClick={onClick}>Propose team</button>);
  await action;
  expect(onClick).toHaveBeenCalledTimes(1);
});

it('re-queries after the loading layout replaces the original control', async () => {
  const onClick = vi.fn();
  const view = render(<div key="loading"><button disabled>Check original change outcome</button></div>);
  const original = screen.getByRole('button') as HTMLButtonElement;
  const action = clickReadyButton('Check original change outcome');
  view.rerender(<section key="ready"><button onClick={onClick}>Check original change outcome</button></section>);
  // A cached node cannot establish readiness of the currently rendered control.
  original.disabled = false;
  expect(original.isConnected).toBe(false);
  await action;
  expect(onClick).toHaveBeenCalledTimes(1);
});
