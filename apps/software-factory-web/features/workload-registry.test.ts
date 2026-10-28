import { describe, expect, it } from 'vitest';

import { unconnectedWorkloadRegistry, workloadKinds } from './workload-registry';

describe('FACTORY-006 workload registry contract', () => {
  it('distinguishes five factory/delivery workload classes from unknown app screens', () => {
    expect(workloadKinds).toEqual([
      'engineering_job', 'ci_build', 'preview', 'runtime_service', 'data_infra',
    ]);
  });

  it('does not fabricate workloads, cost, or running counts while disconnected', () => {
    const view = unconnectedWorkloadRegistry();
    expect(view.availability).toBe('NOT_CONNECTED');
    expect(view.records).toEqual([]);
    expect(view.verifiedCount).toBeNull();
    expect(view.runningCount).toBeNull();
    expect(view.estimatedCostMicrosUSD).toBeNull();
  });

  it('does not authorize deployment from an empty design-only view', () => {
    const view = unconnectedWorkloadRegistry();
    expect(view.releaseAuthority).toBe(false);
    expect(view.integrationRequirements).toEqual(
      expect.arrayContaining([expect.stringContaining('StratoID')]),
    );
  });
});
