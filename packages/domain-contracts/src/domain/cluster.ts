import { z } from 'zod';

export const ClusterStatusSchema = z.enum(['healthy', 'warning']);
export type ClusterStatus = z.infer<typeof ClusterStatusSchema>;

export const ClusterSummarySchema = z.object({
  id: z.string().min(1),
  region: z.string().min(1),
  status: ClusterStatusSchema,
  workloadCount: z.number().int().nonnegative(),
});

export type ClusterSummary = z.infer<typeof ClusterSummarySchema>;
