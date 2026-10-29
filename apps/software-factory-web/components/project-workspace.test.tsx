import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import type { SharedEngineeringProject } from '@/features/projects';
import { ProjectWorkspace } from './project-workspace';

const project: SharedEngineeringProject = {
  id: 'project-a',
  name: 'Farmers market',
  outcome: 'Help local farmers sell produce to restaurants.',
  applicationDomain: 'marketplace',
  repositoryRef: '',
  status: 'intake',
  updatedAt: '2026-10-28T10:00:00Z',
  version: 1,
  workforcePlan: { expert: { name: 'Marketplace SME' } },
};

let memoryStorage: Map<string, string>;

beforeEach(() => {
  memoryStorage = new Map();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => memoryStorage.get(key) ?? null,
      setItem: (key: string, value: string) => memoryStorage.set(key, value),
      removeItem: (key: string) => memoryStorage.delete(key),
      clear: () => memoryStorage.clear(),
    },
  });
});

afterEach(() => {
  memoryStorage.clear();
  vi.restoreAllMocks();
});

it('carries shared product context into an iteration prompt and saves an explicitly local draft', async () => {
  vi.spyOn(crypto, 'randomUUID').mockReturnValue('draft-1');
  render(<ProjectWorkspace project={project} />);

  expect(screen.getByText(project.outcome)).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Describe the next iteration'), {
    target: { value: 'Add farmer inventory management.' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save local draft' }));

  await waitFor(() => expect(screen.getByText(/Iteration draft saved in this browser/)).toBeTruthy());
  expect(screen.getAllByText('Add farmer inventory management.')).toHaveLength(2);
  const saved = JSON.parse(memoryStorage.get('fluxcore:workspace-iterations:v1:project-a') ?? '[]') as Array<{ prompt: string }>;
  expect(saved).toHaveLength(1);
  expect(saved[0]?.prompt).toBe('Add farmer inventory management.');
  expect(screen.getByText(/Agent dispatch, code changes, branch creation/)).toBeTruthy();
});

it('loads a saved browser draft back into the composer', async () => {
  memoryStorage.set('fluxcore:workspace-iterations:v1:project-a', JSON.stringify([
    { id: 'draft-existing', prompt: 'Review the onboarding steps.', createdAt: '2026-10-29T10:00:00Z' },
  ]));
  render(<ProjectWorkspace project={project} />);

  fireEvent.click(await screen.findByRole('button', { name: 'Continue this draft' }));
  expect((screen.getByLabelText('Describe the next iteration') as HTMLTextAreaElement).value).toBe('Review the onboarding steps.');
});
