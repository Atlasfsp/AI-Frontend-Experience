/**
 * Source-only view model for FluxCore ADR-006.
 *
 * These are product-approved candidate categories, NOT a live registry query,
 * provider OAuth session, confirmed MCP tool list or financial entitlement.
 * Replace with the authenticated FluxCore BFF only after independent attested
 * backend integration. The UI has no provider credentials or execution paths.
 */
export type FrontendCapability =
  | 'design'
  | 'prototype'
  | 'design-context'
  | 'design-export'
  | 'code-generation'
  | 'refactoring';

export type FrontendPlatform = {
  id: 'vercel-v0' | 'designer2' | 'google-stitch' | 'figma';
  name: string;
  kind: 'code-provider' | 'design-and-code-candidate' | 'design-source';
  intendedCapabilities: readonly FrontendCapability[];
  connectivity: 'NOT_VERIFIED_LIVE';
  activation: 'NOT_CONNECTED';
  notes: string;
};

export type DeploymentPlatform = {
  id: 'skyforge' | 'appforge';
  name: string;
  intendedTargets: readonly ('web' | 'mobile' | 'services')[];
  connectivity: 'NOT_VERIFIED_LIVE';
  activation: 'NOT_CONNECTED';
  notes: string;
};

const deploymentPlatforms: readonly DeploymentPlatform[] = [
  {
    id: 'skyforge',
    name: 'SkyForge',
    intendedTargets: ['web', 'services'],
    connectivity: 'NOT_VERIFIED_LIVE',
    activation: 'NOT_CONNECTED',
    notes:
      'Optional deployment target. A tenant-scoped adapter, deployment receipt, rollback evidence, and independent release approval are not connected here.',
  },
  {
    id: 'appforge',
    name: 'AppForge',
    intendedTargets: ['mobile'],
    connectivity: 'NOT_VERIFIED_LIVE',
    activation: 'NOT_CONNECTED',
    notes:
      'Mobile delivery destination candidate. No AppForge adapter, store submission, signing, or release authority is connected here.',
  },
];

const platforms: readonly FrontendPlatform[] = [
  {
    id: 'vercel-v0',
    name: 'Vercel v0',
    kind: 'code-provider',
    intendedCapabilities: ['code-generation', 'refactoring', 'design-context'],
    connectivity: 'NOT_VERIFIED_LIVE',
    activation: 'NOT_CONNECTED',
    notes:
      'Existing source adapter is optional; no live account, generation receipt or deploy right is attested.',
  },
  {
    id: 'designer2',
    name: 'Designer2',
    kind: 'design-and-code-candidate',
    intendedCapabilities: [
      'design',
      'prototype',
      'design-export',
      'code-generation',
    ],
    connectivity: 'NOT_VERIFIED_LIVE',
    activation: 'NOT_CONNECTED',
    notes:
      'Separate owned product. MCP server, authenticated tool discovery and artifact export require verification.',
  },
  {
    id: 'google-stitch',
    name: 'Google Stitch',
    kind: 'design-source',
    intendedCapabilities: ['design', 'prototype', 'design-export'],
    connectivity: 'NOT_VERIFIED_LIVE',
    activation: 'NOT_CONNECTED',
    notes:
      'Previously authored 180 screen specifications do not prove native artboards or a connected MCP server.',
  },
  {
    id: 'figma',
    name: 'Figma',
    kind: 'design-source',
    intendedCapabilities: [
      'design',
      'prototype',
      'design-context',
      'design-export',
    ],
    connectivity: 'NOT_VERIFIED_LIVE',
    activation: 'NOT_CONNECTED',
    notes:
      'Remote MCP exists, but tenant OAuth scope, seat permissions and FluxCore tool compatibility are not validated.',
  },
] as const;

export const frontendProviderAuthority = {
  decision: 'ADR-006',
  source: 'FluxCore-Engineering/configs/frontend-providers.v1.json',
  sourceLink: 'https://github.com/Atlasfsp/FluxCore-Engineering/pull/54',
  sourceStatus: 'STATIC_CANDIDATE_CATALOGUE_NOT_SYNCED',
  gateStatus: 'NO_AUTHORIZED_PROVIDER_CONNECTION',
  runtimeRights: false,
  allRequiredGAReceiptsVerified: false,
  authMode: 'INDEPENDENT_STRATOID_AND_SIGNED_APPROVAL_REQUIRED',
} as const;

export function getFrontendProviderCandidates(): readonly FrontendPlatform[] {
  return platforms;
}

export function getDeploymentProviderCandidates(): readonly DeploymentPlatform[] {
  return deploymentPlatforms;
}
