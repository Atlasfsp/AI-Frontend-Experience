import { createMockSession } from '@bac/auth';

export const sessionFixture = createMockSession();

export const buildFixture = {
  id: 'build-1042',
  name: 'Merchant settlement hardening',
  stage: 'quality-gates',
  status: 'warning',
  updatedAt: '2026-03-22T09:05:00.000Z',
};

export const workItemFixture = {
  id: 'wi-204',
  title: 'Instrument deployment review workflow',
  owner: 'BAC Platform',
  priority: 'High',
  status: 'In progress',
  updatedAt: '2026-03-22T08:45:00.000Z',
};
