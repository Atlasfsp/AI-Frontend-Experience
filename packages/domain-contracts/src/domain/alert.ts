import { z } from 'zod';

export const AlertSeveritySchema = z.enum(['critical', 'warning', 'info']);
export type AlertSeverity = z.infer<typeof AlertSeveritySchema>;

export const AlertCategorySchema = z.enum([
  'build.failed',
  'cluster.unhealthy',
  'compliance.drift',
  'gate.failed',
  'quota.exhausted',
]);
export type AlertCategory = z.infer<typeof AlertCategorySchema>;

export const AlertSourceSchema = z.enum(['software-factory', 'platform-automation']);
export type AlertSource = z.infer<typeof AlertSourceSchema>;

export const AlertStatusSchema = z.enum(['active', 'acknowledged', 'investigating']);
export type AlertStatus = z.infer<typeof AlertStatusSchema>;

export const AlertItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  severity: AlertSeveritySchema,
  category: AlertCategorySchema,
  source: AlertSourceSchema,
  status: AlertStatusSchema,
  acknowledged: z.boolean(),
  owner: z.string().min(1),
  workspaceId: z.string().min(1),
  openedAt: z.string().min(1),
  detailLines: z.array(z.string()),
  runbookHref: z.string().min(1),
  targetHref: z.string().min(1),
  incidentHref: z.string().optional(),
});

export type AlertItem = z.infer<typeof AlertItemSchema>;
