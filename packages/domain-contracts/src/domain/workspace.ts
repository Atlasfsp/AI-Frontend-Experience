import { z } from 'zod';

export const WorkspaceStatusSchema = z.enum(['healthy', 'warning']);
export type WorkspaceStatus = z.infer<typeof WorkspaceStatusSchema>;

export const WorkspaceSummarySchema = z.object({
  id: z.string().min(1),
  tenant: z.string().min(1),
  status: WorkspaceStatusSchema,
  promiseCount: z.number().int().nonnegative(),
});

export type WorkspaceSummary = z.infer<typeof WorkspaceSummarySchema>;
