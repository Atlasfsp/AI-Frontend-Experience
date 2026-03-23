import { z } from 'zod';

export const WorkItemSummarySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  owner: z.string().min(1),
  priority: z.string().min(1),
  status: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type WorkItemSummary = z.infer<typeof WorkItemSummarySchema>;
