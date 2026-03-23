import type { ChartDatum, TimelineItem } from '@bac/ui';

interface BuildStageRow {
  detail: string;
  duration: string;
  id: string;
  owner: string;
  stage: string;
  status: string;
}

interface BuildGateRow {
  evidence: string;
  gate: string;
  id: string;
  owner: string;
  status: string;
}

interface BuildArtifactRow {
  digest: string;
  id: string;
  kind: string;
  location: string;
  status: string;
}

export interface BuildDetailModel {
  artifacts: BuildArtifactRow[];
  branch: string;
  commitSha: string;
  gateRows: BuildGateRow[];
  lane: string;
  remediationSnippet: string;
  stageChart: ChartDatum[];
  stageRows: BuildStageRow[];
  terminalLines: string[];
  timeline: TimelineItem[];
  triggeredBy: string;
}

const defaultDetail: BuildDetailModel = {
  branch: 'release/unknown',
  commitSha: 'e3a7c8f',
  lane: 'release-candidate',
  triggeredBy: 'factory@stratogroup.dev',
  stageChart: [
    { annotation: 'Preparation and fetch window', label: 'Prepare', tone: 'cyan', value: 7 },
    { annotation: 'Compile and static checks', label: 'Build', tone: 'emerald', value: 12 },
    { annotation: 'Verification and evidence capture', label: 'Verify', tone: 'amber', value: 9 },
  ],
  stageRows: [
    {
      id: 'queued',
      stage: 'Queued',
      owner: 'Planner',
      duration: '4m',
      status: 'Complete',
      detail: 'Work item bundle accepted and execution lane reserved.',
    },
    {
      id: 'compile',
      stage: 'Compile',
      owner: 'Builder',
      duration: '12m',
      status: 'Complete',
      detail: 'Typed build, lint, and artifact packaging completed.',
    },
    {
      id: 'verify',
      stage: 'Verify',
      owner: 'Quality mesh',
      duration: '9m',
      status: 'Review required',
      detail: 'One control requires manual sign-off before promotion.',
    },
  ],
  gateRows: [
    {
      id: 'tests',
      gate: 'Test suite',
      owner: 'Quality mesh',
      status: 'Passing',
      evidence: 'Unit, typecheck, and build gates cleared.',
    },
    {
      id: 'policy',
      gate: 'Policy controls',
      owner: 'Compliance',
      status: 'Manual review',
      evidence: 'Dependency exception expires in three hours.',
    },
  ],
  artifacts: [
    {
      id: 'artifact-web',
      kind: 'Web bundle',
      digest: 'sha256:4f0dbe8a',
      location: 's3://bac-artifacts/release/web.tar.zst',
      status: 'Published',
    },
    {
      id: 'artifact-evidence',
      kind: 'Evidence pack',
      digest: 'sha256:98ce17d3',
      location: 's3://bac-artifacts/evidence/build-unknown.json',
      status: 'Ready',
    },
  ],
  timeline: [
    {
      actor: 'Build mesh',
      title: 'Build accepted',
      description: 'Execution lane reserved and artifact plan attached.',
      status: 'success',
      time: '08:50 UTC',
    },
    {
      actor: 'Compliance',
      title: 'Policy review raised',
      description: 'One dependency exception requires manual approval before promotion.',
      status: 'warning',
      time: '09:05 UTC',
    },
    {
      actor: 'Release manager',
      title: 'Promotion package staged',
      description: 'Rollback bundle and evidence pack linked to the release candidate.',
      status: 'neutral',
      time: '09:18 UTC',
    },
  ],
  terminalLines: [
    '$ bac builds inspect --build build-unknown --format terminal',
    'build_status ................. review-required',
    'artifact_bundle .............. published',
    'rollback_bundle .............. ready',
    'policy_controls .............. one manual review',
    'next_action .................. security waiver approval',
  ],
  remediationSnippet: `pnpm check
bac builds retry --build build-unknown --stage verify
bac release promote --build build-unknown --lane release-candidate`,
};

const buildDetailsById: Record<string, BuildDetailModel> = {
  'build-1042': {
    branch: 'release/merchant-settlement-hardening',
    commitSha: '2c9f1ab',
    lane: 'merchant-prod-window',
    triggeredBy: 'release@stratogroup.dev',
    stageChart: [
      { annotation: 'Dependency hydrate and environment prep', label: 'Prepare', tone: 'cyan', value: 6 },
      { annotation: 'Compile, lint, and static asset generation', label: 'Build', tone: 'emerald', value: 15 },
      { annotation: 'Tests, attestation, and evidence capture', label: 'Verify', tone: 'amber', value: 11 },
    ],
    stageRows: [
      {
        id: 'prepare',
        stage: 'Prepare',
        owner: 'Factory planner',
        duration: '6m',
        status: 'Complete',
        detail: 'Requirement bundle, ADR set, and workspace scope resolved cleanly.',
      },
      {
        id: 'build',
        stage: 'Build',
        owner: 'Build mesh',
        duration: '15m',
        status: 'Complete',
        detail: 'Next.js shell, shared UI, and generated client seams compiled and packaged.',
      },
      {
        id: 'verify',
        stage: 'Verify',
        owner: 'Quality + policy',
        duration: '11m',
        status: 'Manual review',
        detail: 'Dependency exception is bounded but still needs a security waiver.',
      },
      {
        id: 'promote',
        stage: 'Promote',
        owner: 'Release manager',
        duration: 'Pending',
        status: 'Blocked',
        detail: 'Waiting for final compliance sign-off before rollout can open.',
      },
    ],
    gateRows: [
      {
        id: 'lint',
        gate: 'Lint and type safety',
        owner: 'Quality mesh',
        status: 'Passing',
        evidence: 'Monorepo checks cleared with strict TypeScript enabled.',
      },
      {
        id: 'tests',
        gate: 'Build and regression suite',
        owner: 'Quality mesh',
        status: 'Passing',
        evidence: 'Critical shell and route coverage complete for this candidate.',
      },
      {
        id: 'policy',
        gate: 'Policy controls',
        owner: 'Security',
        status: 'Manual review',
        evidence: 'One approved exception must be re-acknowledged for this release window.',
      },
    ],
    artifacts: [
      {
        id: 'web-bundle',
        kind: 'Web bundle',
        digest: 'sha256:aa4e2c91',
        location: 's3://bac-artifacts/software-factory/build-1042/web.tar.zst',
        status: 'Published',
      },
      {
        id: 'evidence-pack',
        kind: 'Evidence pack',
        digest: 'sha256:34f91be7',
        location: 's3://bac-artifacts/software-factory/build-1042/evidence.json',
        status: 'Ready',
      },
      {
        id: 'rollback-bundle',
        kind: 'Rollback bundle',
        digest: 'sha256:7b983a11',
        location: 's3://bac-artifacts/software-factory/build-1042/rollback.tar.zst',
        status: 'Ready',
      },
    ],
    timeline: [
      {
        actor: 'Planner',
        title: 'Release bundle frozen',
        description: 'PRD, ADR, and contract attachments were locked to support repeatable evidence.',
        status: 'success',
        time: '08:42 UTC',
      },
      {
        actor: 'Security review',
        title: 'Dependency exception escalated',
        description: 'A bounded waiver is still required before the promotion action can execute.',
        status: 'warning',
        time: '09:05 UTC',
      },
      {
        actor: 'Release manager',
        title: 'Promotion lane staged',
        description: 'Merchant production window prepared with rollback bundle attached.',
        status: 'neutral',
        time: '09:18 UTC',
      },
    ],
    terminalLines: [
      '$ bac builds inspect --build build-1042 --format terminal',
      'stage.prepare ............... pass',
      'stage.build ................. pass',
      'stage.verify ................ manual-review',
      'artifact.bundle ............. published',
      'rollback.bundle ............. ready',
      'release.lane ............... merchant-prod-window',
      'next_action ................. security waiver approval',
    ],
    remediationSnippet: `pnpm check
bac builds retry --build build-1042 --stage verify
bac release promote --build build-1042 --lane merchant-prod-window`,
  },
  'build-1043': {
    branch: 'release/platform-bootstrap-telemetry',
    commitSha: '74ae11c',
    lane: 'platform-observability',
    triggeredBy: 'platform@stratogroup.dev',
    stageChart: [
      { annotation: 'Source hydrate and environment preparation', label: 'Prepare', tone: 'cyan', value: 5 },
      { annotation: 'Compile and artifact publishing', label: 'Build', tone: 'emerald', value: 10 },
      { annotation: 'Verification and release evidence', label: 'Verify', tone: 'emerald', value: 7 },
    ],
    stageRows: [
      {
        id: 'prepare',
        stage: 'Prepare',
        owner: 'Factory planner',
        duration: '5m',
        status: 'Complete',
        detail: 'Telemetry acceptance criteria and rollout scope attached.',
      },
      {
        id: 'build',
        stage: 'Build',
        owner: 'Build mesh',
        duration: '10m',
        status: 'Complete',
        detail: 'Artifacts published for docs, platform shell, and shared observability package.',
      },
      {
        id: 'verify',
        stage: 'Verify',
        owner: 'Quality mesh',
        duration: '7m',
        status: 'Passing',
        detail: 'Evidence bundle assembled and ready for promotion.',
      },
    ],
    gateRows: [
      {
        id: 'tests',
        gate: 'Regression suite',
        owner: 'Quality mesh',
        status: 'Passing',
        evidence: 'All critical shell flows green.',
      },
      {
        id: 'observability',
        gate: 'Trace and metrics controls',
        owner: 'Observability',
        status: 'Passing',
        evidence: 'Collector and trace export configuration verified.',
      },
    ],
    artifacts: [
      {
        id: 'artifact-web',
        kind: 'Web bundle',
        digest: 'sha256:18fe9ab2',
        location: 's3://bac-artifacts/software-factory/build-1043/web.tar.zst',
        status: 'Published',
      },
      {
        id: 'artifact-otel',
        kind: 'Trace manifest',
        digest: 'sha256:bb30117c',
        location: 's3://bac-artifacts/software-factory/build-1043/otel.json',
        status: 'Ready',
      },
    ],
    timeline: [
      {
        actor: 'Observability',
        title: 'Trace policy attached',
        description: 'OpenTelemetry export and collector coverage linked before build execution.',
        status: 'success',
        time: '08:20 UTC',
      },
      {
        actor: 'Release manager',
        title: 'Candidate ready',
        description: 'No blocking findings remain; candidate can promote when the window opens.',
        status: 'success',
        time: '08:30 UTC',
      },
    ],
    terminalLines: [
      '$ bac builds inspect --build build-1043 --format terminal',
      'stage.prepare ............... pass',
      'stage.build ................. pass',
      'stage.verify ................ pass',
      'artifact.bundle ............. published',
      'promotion.status ............ ready',
    ],
    remediationSnippet: `pnpm check
bac release promote --build build-1043 --lane platform-observability`,
  },
};

export function getBuildDetailModel(buildId: string): BuildDetailModel {
  return buildDetailsById[buildId] ?? {
    ...defaultDetail,
    artifacts: defaultDetail.artifacts.map((artifact) => ({
      ...artifact,
      location: artifact.location.replace('build-unknown', buildId),
    })),
    remediationSnippet: defaultDetail.remediationSnippet.replaceAll('build-unknown', buildId),
    terminalLines: defaultDetail.terminalLines.map((line) => line.replaceAll('build-unknown', buildId)),
  };
}
