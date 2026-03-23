import type { NavigationSection } from '@bac/ui';

export const navigation: NavigationSection[] = [
  {
    title: 'Software Factory',
    items: [
      {
        href: '/software-factory/dashboard',
        label: 'Dashboard',
        description: 'Build health, quality gates, and active flow summary.',
        keywords: ['overview', 'home', 'delivery'],
        permission: 'workspace:view',
      },
      {
        href: '/software-factory/workspaces',
        label: 'Workspaces',
        description: 'Project and workspace selector for the delivery context.',
        keywords: ['project', 'workspace', 'selector'],
        permission: 'workspace:view',
      },
      {
        href: '/software-factory/prd-intake',
        label: 'PRD Intake',
        description: 'Structured requirement intake and definition-of-ready view.',
        keywords: ['requirements', 'product', 'intake'],
        permission: 'workspace:manage',
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
        description: 'Promotion queue, release windows, and rollback readiness.',
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
        description: 'First-class OpenAPI explorer inside the software-factory shell.',
        keywords: ['openapi', 'swagger', 'api explorer'],
        permission: 'workspace:view',
      },
    ],
  },
];
