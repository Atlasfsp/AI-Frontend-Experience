import { z } from 'zod';

import { BuildSummarySchema, type BuildSummary } from './build';

export const SoftwareFactoryOverviewSchema = z.object({
  activeBuilds: z.number().int().nonnegative(),
  gatePassRate: z.string().min(1),
  openReviews: z.number().int().nonnegative(),
  recentBuild: BuildSummarySchema,
});

export type SoftwareFactoryOverview = z.infer<typeof SoftwareFactoryOverviewSchema>;
