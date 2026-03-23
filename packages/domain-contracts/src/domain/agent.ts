import { z } from 'zod';

export const AgentStatusSchema = z.enum(['healthy', 'working', 'idle']);
export type AgentStatus = z.infer<typeof AgentStatusSchema>;

export const AgentSummarySchema = z.object({
  id: z.string().min(1),
  service: z.string().min(1),
  model: z.string().min(1),
  status: AgentStatusSchema,
});

export type AgentSummary = z.infer<typeof AgentSummarySchema>;
