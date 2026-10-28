/** Factory dashboard evidence labels: API reachability is NOT CI attestation. */
export type FactoryDataMode = 'DEMO' | 'API_REPORTED_UNVERIFIED' | 'UNAVAILABLE';

export interface FactorySourceLabel {
  mode: FactoryDataMode;
  headline: string;
  caution: string;
  verifiedReleaseEvidence: false;
}

export function classifyFactoryDataSource(
  enableMockApi: boolean,
  apiAvailable = true,
  environment: string = 'development',
): FactorySourceLabel {
  if (environment === 'production' && enableMockApi) {
    return {
      mode: 'UNAVAILABLE',
      headline: 'Production dashboard blocked: mock API mode enabled',
      caution: 'No production metric can be accepted from the development fixture source.',
      verifiedReleaseEvidence: false,
    };
  }
  if (!apiAvailable) {
    return {
      mode: 'UNAVAILABLE',
      headline: 'Operational data unavailable',
      caution: 'Upstream is unreachable; no previous result is treated as current.',
      verifiedReleaseEvidence: false,
    };
  }
  if (enableMockApi) {
    return {
      mode: 'DEMO',
      headline: 'Demonstration data — not live operations',
      caution: 'Sample agents, builds and timelines must never count as passing CI, cost or production health.',
      verifiedReleaseEvidence: false,
    };
  }
  return {
    mode: 'API_REPORTED_UNVERIFIED',
    headline: 'API-reported operations — independent CI attestation not connected',
    caution: 'Statuses are reported by the application API, not validated signed build/release receipts.',
    verifiedReleaseEvidence: false,
  };
}
