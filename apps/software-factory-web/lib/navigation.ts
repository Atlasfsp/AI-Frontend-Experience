import type { NavigationSection } from '@bac/ui';

export const navigation: NavigationSection[] = [
  {
    title: 'Build',
    items: [
      {
        href: '/software-factory/prd-intake',
        label: 'FluxCore Create',
        description:
          'Describe an idea in plain language and review its proposed application SME and engineering team.',
        keywords: ['vibe coding', 'idea', 'create', 'app', 'SME'],
        permission: 'workspace:manage',
      },
      {
        href: '/software-factory/workspaces',
        label: 'FluxCore Engineer',
        description:
          'Open shared projects, link repositories, and continue work in the engineering console.',
        keywords: [
          'developer',
          'project',
          'workspace',
          'repository',
          'engineer',
        ],
        permission: 'workspace:view',
      },
    ],
  },
  {
    title: 'Engineering tools',
    items: [
      {
        href: '/software-factory/dashboard',
        label: 'Operations overview',
        description:
          'Factory operations, delivery evidence, and active flow summary.',
        keywords: ['overview', 'home', 'delivery'],
        permission: 'workspace:view',
      },
      {
        href: '/software-factory/workloads',
        label: 'Workloads',
        description:
          'Factory jobs, builds, preview environments and service workloads; source-labelled.',
        keywords: [
          'workload',
          'execution',
          'capacity',
          'service',
          'runtime',
          'preview',
        ],
        permission: 'workspace:view',
      },
      {
        href: '/software-factory/architecture',
        label: 'Architecture',
        description: 'Service boundaries, BFF seams, and integration design.',
        keywords: ['system design', 'viewer'],
        permission: 'application:view',
      },
      {
        href: '/software-factory/domain-model',
        label: 'Domain Model',
        description: 'Bounded contexts, aggregates, and invariants.',
        keywords: ['ddd', 'entities', 'aggregates'],
        permission: 'application:view',
      },
      {
        href: '/software-factory/adrs',
        label: 'ADRs',
        description: 'Architecture decisions and frontend-impact record.',
        keywords: ['architecture decisions', 'records'],
        permission: 'application:view',
      },
      {
        href: '/software-factory/builds',
        label: 'Build / Test',
        description: 'Execution history, stage progression, and test posture.',
        keywords: ['pipelines', 'quality gates'],
        permission: 'application:view',
      },
      {
        href: '/software-factory/release-manager',
        label: 'Release Manager',
        description:
          'Promotion queue, release windows, and rollback readiness.',
        keywords: ['promotions', 'rollout', 'release'],
        permission: 'application:deploy',
      },
      {
        href: '/software-factory/compliance',
        label: 'Compliance',
        description: 'Policy status, attestations, and release evidence.',
        keywords: ['controls', 'audit', 'evidence'],
        permission: 'application:view',
      },
      {
        href: '/software-factory/activity',
        label: 'Activity',
        description: 'Unified timeline for builds, releases, and audit events.',
        keywords: ['timeline', 'events'],
        permission: 'application:view',
      },
      {
        href: '/software-factory/settings',
        label: 'Settings',
        description: 'Identity, access, and audit administration.',
        keywords: ['access', 'audit', 'settings'],
        permission: 'workspace:view',
      },
    ],
  },
  {
    title: 'Contracts',
    items: [
      {
        href: '/software-factory/api-contracts',
        label: 'API Contracts',
        description: 'Generated client seams and endpoint ownership.',
        keywords: ['clients', 'sdk', 'contracts'],
        permission: 'workspace:view',
      },
      {
        href: '/software-factory/swagger',
        label: 'Swagger Explorer',
        description:
          'First-class OpenAPI explorer inside the software-factory shell.',
        keywords: ['openapi', 'swagger', 'api explorer'],
        permission: 'workspace:view',
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        href: '/admin',
        label: 'Admin console',
        description: 'Manage platform health, model gateway connections, and operator settings.',
        keywords: ['admin', 'platform', 'agentgateway', 'llm', 'models'],
        permission: 'workspace:manage',
      },
    ],
  },
];
