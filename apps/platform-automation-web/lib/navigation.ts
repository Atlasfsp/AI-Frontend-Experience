import type { NavigationSection } from '@bac/ui';

export const navigation: NavigationSection[] = [
  {
    title: 'Platform',
    items: [
      {
        href: '/platform/dashboard',
        label: 'Dashboard',
        description: 'Cluster health, fleet sync, and operator summary.',
        keywords: ['overview', 'control plane', 'home'],
        permission: 'workspace:view',
      },
      {
        href: '/platform/regions',
        label: 'Regions',
        description: 'Regional estate health, capacity, and availability.',
        keywords: ['geography', 'regional'],
        permission: 'database_cluster:view',
      },
      {
        href: '/platform/clusters',
        label: 'Clusters',
        description: 'Regional cluster inventory and status.',
        keywords: ['fleet', 'clusters'],
        permission: 'database_cluster:view',
      },
      {
        href: '/platform/workspace-factory',
        label: 'Workspace Factory',
        description: 'Tenant and workspace provisioning control surface.',
        keywords: ['tenant', 'factory', 'provisioning'],
        permission: 'workspace:manage',
      },
      {
        href: '/platform/promises',
        label: 'Promise Catalog',
        description: 'Governed platform promise catalog scaffolding.',
        keywords: ['catalog', 'promises'],
        permission: 'promise:view',
      },
      {
        href: '/platform/gitops',
        label: 'GitOps',
        description: 'GitOps convergence, rollout posture, and sync drift.',
        keywords: ['fleet', 'deployments', 'drift'],
        permission: 'database_cluster:view',
      },
      {
        href: '/platform/observability',
        label: 'Observability',
        description: 'Signals, active incidents, and escalation hooks.',
        keywords: ['metrics', 'logs', 'traces'],
        permission: 'audit_log:view',
      },
      {
        href: '/platform/policy',
        label: 'Policy',
        description: 'Compliance center for platform controls and findings.',
        keywords: ['compliance', 'policy'],
        permission: 'audit_log:view',
      },
      {
        href: '/platform/identity',
        label: 'Identity',
        description: 'Identity, auth, and access settings for platform operations.',
        keywords: ['authentik', 'spicedb', 'access'],
        permission: 'secret:read',
      },
      {
        href: '/platform/incidents',
        label: 'Incidents / DR',
        description: 'Incident response and disaster recovery coordination.',
        keywords: ['incident', 'dr', 'recovery'],
        permission: 'audit_log:view',
      },
      {
        href: '/platform/quotas',
        label: 'Quotas / Cost',
        description: 'Capacity, quota, and cost dashboards.',
        keywords: ['quotas', 'cost', 'budget'],
        permission: 'workspace:view',
      },
      {
        href: '/platform/runbooks',
        label: 'Runbooks',
        description: 'Operator runbooks and platform documentation.',
        keywords: ['docs', 'help'],
        permission: 'workspace:view',
      },
    ],
  },
  {
    title: 'Shared Tools',
    items: [
      {
        href: '/api-explorer',
        label: 'API Explorer',
        description: 'Platform API and contract surface.',
        permission: 'workspace:view',
      },
      {
        href: '/api-explorer/platform',
        label: 'Platform Docs',
        description: 'Workspace GraphQL, Rancher, and Fleet endpoint guidance.',
        permission: 'workspace:view',
      },
    ],
  },
];
