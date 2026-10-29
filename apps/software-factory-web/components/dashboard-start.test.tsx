import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import { DashboardStart } from './dashboard-start';

it('lets a new builder start from a short idea or an example prompt', () => {
  render(<DashboardStart />);

  fireEvent.click(screen.getByRole('button', { name: /A booking app/ }));
  expect(
    (screen.getByLabelText('Describe your idea') as HTMLTextAreaElement).value,
  ).toContain('appointments');

  const form = screen.getByRole('button', { name: 'Continue to Create' })
    .parentElement?.parentElement;
  expect(form?.getAttribute('action')).toBe('/software-factory/prd-intake');
  expect(form?.getAttribute('method')).toBe('get');
});

it('keeps blank ideas from being submitted and offers a separate path for existing code', () => {
  render(<DashboardStart />);

  expect(
    (screen.getByRole('button', { name: 'Continue to Create' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  expect(screen.getByRole('link', { name: 'Open FluxCore Engineer' }).getAttribute('href')).toBe(
    '/software-factory/workspaces',
  );
});
