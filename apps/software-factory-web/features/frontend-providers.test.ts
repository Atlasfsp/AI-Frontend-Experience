import { describe, expect, it } from 'vitest';

import {
  frontendProviderAuthority,
  getFrontendProviderCandidates,
} from './frontend-providers';

describe('FluxCore ADR-006 frontend provider candidate view model', () => {
  it('defines four named providers with no duplicates', () => {
    const candidates = getFrontendProviderCandidates();
    expect(candidates.map((p) => p.id)).toEqual([
      'vercel-v0',
      'designer2',
      'google-stitch',
      'figma',
    ]);
    expect(new Set(candidates.map((p) => p.id)).size).toBe(4);
  });

  it('never claims active credentials, runtime availability or production rights', () => {
    for (const provider of getFrontendProviderCandidates()) {
      expect(provider.activation).toBe('NOT_CONNECTED');
      expect(provider.connectivity).toBe('NOT_VERIFIED_LIVE');
      expect(provider.intendedCapabilities.length).toBeGreaterThan(0);
      expect(provider.intendedCapabilities).not.toContain('deploy');
    }
    expect(frontendProviderAuthority.runtimeRights).toBe(false);
    expect(frontendProviderAuthority.allRequiredGAReceiptsVerified).toBe(false);
    expect(frontendProviderAuthority.sourceStatus).toBe(
      'STATIC_CANDIDATE_CATALOGUE_NOT_SYNCED',
    );
  });

  it('does not imply every design provider supports source generation', () => {
    const candidates = getFrontendProviderCandidates();
    const byId = Object.fromEntries(candidates.map((p) => [p.id, p]));
    expect(byId['vercel-v0'].intendedCapabilities).toContain('code-generation');
    expect(byId.designer2.intendedCapabilities).toContain('code-generation');
    expect(byId['google-stitch'].intendedCapabilities).not.toContain('code-generation');
    expect(byId.figma.intendedCapabilities).not.toContain('code-generation');
  });
});
