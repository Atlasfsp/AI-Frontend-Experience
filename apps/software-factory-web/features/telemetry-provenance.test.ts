import { describe, expect, it } from 'vitest';

import { classifyFactoryDataSource } from './telemetry-provenance';

describe('AI Factory dual-plane source integrity', () => {
  it('never calls default fixture data live operations', () => {
    const result = classifyFactoryDataSource(true);
    expect(result.mode).toBe('DEMO');
    expect(result.verifiedReleaseEvidence).toBe(false);
    expect(result.caution).toContain('Sample');
  });

  it('does not elevate a reachable application API into certified CI', () => {
    const result = classifyFactoryDataSource(false);
    expect(result.mode).toBe('API_REPORTED_UNVERIFIED');
    expect(result.verifiedReleaseEvidence).toBe(false);
  });

  it('fails closed when upstream is unavailable even if mocks are enabled', () => {
    const result = classifyFactoryDataSource(true, false);
    expect(result.mode).toBe('UNAVAILABLE');
    expect(result.verifiedReleaseEvidence).toBe(false);
  });
});
