import { z } from 'zod';

import { BAC_ROLES } from '../roles';

export const StatusToneSchema = z.enum(['critical', 'warning', 'success', 'info', 'neutral']);
export type StatusTone = z.infer<typeof StatusToneSchema>;

export const DashboardMetricSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  value: z.string().min(1),
  hint: z.string(),
  tone: StatusToneSchema,
});

export type DashboardMetric = z.infer<typeof DashboardMetricSchema>;

export const DashboardShortcutSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string(),
  href: z.string().min(1),
  tone: StatusToneSchema,
});

export type DashboardShortcut = z.infer<typeof DashboardShortcutSchema>;

export const DashboardBriefingSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  emphasis: z.string(),
});

export type DashboardBriefing = z.infer<typeof DashboardBriefingSchema>;

export const DashboardSummarySchema = z.object({
  activeWorkspace: z.string().min(1),
  role: z.enum(BAC_ROLES),
  metrics: z.array(DashboardMetricSchema),
  briefings: z.array(DashboardBriefingSchema),
  shortcuts: z.array(DashboardShortcutSchema),
  costSummary: z.string(),
  pendingSyncCount: z.number().int().nonnegative(),
});

export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;
