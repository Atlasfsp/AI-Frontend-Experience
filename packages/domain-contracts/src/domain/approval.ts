import { z } from 'zod';

export const ApprovalKindSchema = z.enum(['deployment', 'access', 'manifest']);
export type ApprovalKind = z.infer<typeof ApprovalKindSchema>;

export const ApprovalRiskSchema = z.enum(['critical', 'high', 'moderate']);
export type ApprovalRisk = z.infer<typeof ApprovalRiskSchema>;

export const ApprovalStatusSchema = z.enum(['pending', 'approved', 'rejected', 'waiting']);
export type ApprovalStatus = z.infer<typeof ApprovalStatusSchema>;

export const ApprovalItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  kind: ApprovalKindSchema,
  risk: ApprovalRiskSchema,
  status: ApprovalStatusSchema,
  requester: z.string().min(1),
  requestedAt: z.string().min(1),
  dueAt: z.string().min(1),
  workspaceId: z.string().min(1),
  checks: z.array(z.string()),
  targetHref: z.string().min(1),
});

export type ApprovalItem = z.infer<typeof ApprovalItemSchema>;
