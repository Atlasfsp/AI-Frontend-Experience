import { fireEvent, screen, waitFor } from '@testing-library/react';

export async function clickReadyButton(name: string, root: Pick<typeof screen, 'getByRole'> = screen) {
  await waitFor(() => {
    // Re-query on every attempt: loading and ready layouts can replace a
    // control while the old, detached node still reports disabled=false.
    const button = root.getByRole('button', { name }) as HTMLButtonElement;
    if (!button.isConnected || button.disabled) throw new Error(`Button not ready: ${name}`);
    // No assertion or await after dispatch, so a successful click is not retried.
    fireEvent.click(button);
  });
}
