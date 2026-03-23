import { z } from 'zod';

export const PromiseStatusSchema = z.enum(['available', 'preview']);
export type PromiseStatus = z.infer<typeof PromiseStatusSchema>;

export const PromiseSummarySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  owner: z.string().min(1),
  status: PromiseStatusSchema,
});

export type PromiseSummary = z.infer<typeof PromiseSummarySchema>;
