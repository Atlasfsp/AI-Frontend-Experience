import { z } from 'zod';

export const BuildStatusSchema = z.enum(['success', 'warning', 'danger', 'neutral']);
export type BuildStatus = z.infer<typeof BuildStatusSchema>;

export const BuildSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  stage: z.string().min(1),
  status: BuildStatusSchema,
  updatedAt: z.string().min(1),
});

export type BuildSummary = z.infer<typeof BuildSummarySchema>;
