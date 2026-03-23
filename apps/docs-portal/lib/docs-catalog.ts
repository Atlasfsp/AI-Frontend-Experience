export interface DocEntry {
  audience: string[];
  href: string;
  id: string;
  keywords: string[];
  kind: 'guide' | 'overview' | 'reference' | 'runbook';
  owner: string;
  readTime: string;
  section: 'api' | 'architecture' | 'operations' | 'product' | 'support';
  summary: string;
  title: string;
}

export interface DocsSection {
  description: string;
  items: DocEntry[];
  title: string;
}

export const docsIndex: DocEntry[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    href: '/getting-started',
    summary:
      'Local environment setup, mock-mode defaults, validation commands, and first-run expectations for the monorepo.',
    section: 'operations',
    kind: 'guide',
    readTime: '6 min',
    owner: 'Frontend Platform',
    audience: ['Engineers', 'Operators'],
    keywords: ['setup', 'environment', 'onboarding', 'mock mode', 'pnpm'],
  },
  {
    id: 'architecture',
    title: 'Architecture Overview',
    href: '/architecture',
    summary:
      'System map for apps, shared packages, auth seams, generated clients, and observability pathways across the web layer.',
    section: 'architecture',
    kind: 'overview',
    readTime: '8 min',
    owner: 'Architecture',
    audience: ['Engineers', 'Tech leads'],
    keywords: ['architecture', 'next.js', 'authentik', 'hasura', 'spicedb'],
  },
  {
    id: 'software-factory',
    title: 'Software Factory Guides',
    href: '/software-factory',
    summary:
      'Product documentation for PRD intake, architecture review, contracts, builds, release evidence, and audit views.',
    section: 'product',
    kind: 'guide',
    readTime: '9 min',
    owner: 'AI Software Factory',
    audience: ['Product engineers', 'Release operators'],
    keywords: ['software factory', 'prd', 'adr', 'swagger', 'builds', 'release manager'],
  },
  {
    id: 'platform-automation',
    title: 'Platform Automation Guides',
    href: '/platform',
    summary:
      'Control-plane workflows for regions, clusters, workspace factory, GitOps, incidents, identity, quotas, and cost review.',
    section: 'product',
    kind: 'guide',
    readTime: '9 min',
    owner: 'AI Platform Automation',
    audience: ['Platform operators', 'SREs'],
    keywords: ['platform', 'control plane', 'gitops', 'quotas', 'incidents', 'clusters'],
  },
  {
    id: 'adrs',
    title: 'Architecture Decisions',
    href: '/adrs',
    summary:
      'Decision log for repo boundaries, Next.js application shape, shared package direction, and API exploration strategy.',
    section: 'architecture',
    kind: 'reference',
    readTime: '7 min',
    owner: 'Architecture',
    audience: ['Engineers', 'Tech leads'],
    keywords: ['adrs', 'decisions', 'repo boundaries', 'tokens', 'bff'],
  },
  {
    id: 'api-surfaces',
    title: 'API Surfaces',
    href: '/api',
    summary:
      'Overview of generated client seams, Swagger/OpenAPI usage, GraphQL integration points, and BFF expectations.',
    section: 'api',
    kind: 'overview',
    readTime: '7 min',
    owner: 'API Platform',
    audience: ['Frontend engineers', 'Platform engineers'],
    keywords: ['api', 'openapi', 'swagger', 'graphql', 'codegen', 'bff'],
  },
  {
    id: 'api-reference',
    title: 'API Reference Index',
    href: '/api-reference',
    summary:
      'Reference matrix for SDX OpenAPI, platform control-plane surfaces, client packages, and consumer authentication context.',
    section: 'api',
    kind: 'reference',
    readTime: '8 min',
    owner: 'API Platform',
    audience: ['Frontend engineers', 'Integrators'],
    keywords: ['reference', 'contracts', 'endpoints', 'sdk', 'clients'],
  },
  {
    id: 'runbooks',
    title: 'Runbooks',
    href: '/runbooks',
    summary:
      'Day-two guidance for deployment validation, auth degradation, contract sync, release issues, and incident response.',
    section: 'operations',
    kind: 'runbook',
    readTime: '10 min',
    owner: 'Operations',
    audience: ['Operators', 'On-call engineers'],
    keywords: ['runbooks', 'deploy', 'rollback', 'incident', 'auth', 'contracts'],
  },
  {
    id: 'help-center',
    title: 'Help Center',
    href: '/help',
    summary:
      'Escalation paths, FAQs, support ownership, and what to check before opening frontend or platform issues.',
    section: 'support',
    kind: 'guide',
    readTime: '5 min',
    owner: 'Developer Experience',
    audience: ['Everyone'],
    keywords: ['help', 'support', 'faq', 'ownership', 'escalation'],
  },
];

const sectionOrder: Array<DocsSection['title']> = [
  'Product Docs',
  'Architecture',
  'APIs',
  'Operations',
  'Support',
];

const sectionMetadata: Record<DocEntry['section'], Omit<DocsSection, 'items'>> = {
  product: {
    title: 'Product Docs',
    description:
      'Working guides for the AI Software Factory and AI Platform Automation operator experiences.',
  },
  architecture: {
    title: 'Architecture',
    description:
      'Structural context for repo boundaries, shared packages, and decision-making rationale.',
  },
  api: {
    title: 'APIs',
    description:
      'Client generation, contract governance, explorer strategy, and integration-ready references.',
  },
  operations: {
    title: 'Operations',
    description:
      'Onboarding, operating guidance, and repeatable runbooks for changes and recovery.',
  },
  support: {
    title: 'Support',
    description:
      'Ownership guidance, FAQs, and support paths when the first-line docs do not resolve the issue.',
  },
};

export const docsSections: DocsSection[] = sectionOrder
  .map((title) =>
    Object.entries(sectionMetadata)
      .filter(([, metadata]) => metadata.title === title)
      .map(([section, metadata]) => ({
        ...metadata,
        items: docsIndex.filter((entry) => entry.section === section),
      })),
  )
  .flat();

export const featuredDocs = docsIndex.filter((entry) =>
  ['getting-started', 'software-factory', 'platform-automation', 'api-surfaces'].includes(entry.id),
);

export function searchDocs(query: string) {
  const search = query.trim().toLowerCase();

  if (!search) {
    return docsIndex;
  }

  return docsIndex.filter((entry) =>
    [entry.title, entry.summary, entry.owner, entry.section, entry.kind, ...entry.keywords, ...entry.audience]
      .join(' ')
      .toLowerCase()
      .includes(search),
  );
}
