export type GovernanceMode = 'HOTL' | 'HITL' | 'FULL_AUTONOMY';

export interface FeatureFlags {
  graphiqlExplorer: boolean;
  swaggerExplorer: boolean;
  mockApi: boolean;
  auditTrail: boolean;
  liveSubscriptions: boolean;
  oidcLogin: boolean;
  previewDeploys: boolean;
  governanceMode: GovernanceMode;
}

export function createFeatureFlags(source: Record<string, string | undefined>): FeatureFlags {
  const isEnabled = (value: string | undefined, defaultValue = true) => {
    if (value === undefined) {
      return defaultValue;
    }

    return value === 'true';
  };

  return {
    graphiqlExplorer: isEnabled(source.NEXT_PUBLIC_BAC_FEATURE_GRAPHIQL),
    swaggerExplorer: isEnabled(source.NEXT_PUBLIC_BAC_FEATURE_SWAGGER),
    mockApi: isEnabled(source.NEXT_PUBLIC_BAC_ENABLE_MOCK_API, true),
    auditTrail: isEnabled(source.NEXT_PUBLIC_BAC_FEATURE_AUDIT_TRAIL),
    liveSubscriptions: isEnabled(source.NEXT_PUBLIC_BAC_FEATURE_LIVE_SUBSCRIPTIONS, true),
    oidcLogin: isEnabled(source.NEXT_PUBLIC_BAC_FEATURE_OIDC_LOGIN, true),
    previewDeploys: isEnabled(source.NEXT_PUBLIC_BAC_FEATURE_PREVIEW_DEPLOYS, true),
    governanceMode: (() => {
      const mode = source.NEXT_PUBLIC_BAC_GOVERNANCE_MODE;
      if (mode === 'HITL' || mode === 'FULL_AUTONOMY') return mode;
      return 'HOTL' as const;
    })(),
  };
}
