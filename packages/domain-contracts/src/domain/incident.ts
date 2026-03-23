import { z } from 'zod';

export const IncidentSeveritySchema = z.enum(['critical', 'warning']);
export type IncidentSeverity = z.infer<typeof IncidentSeveritySchema>;

export const IncidentStatusSchema = z.enum(['investigating', 'mitigated', 'monitoring']);
export type IncidentStatus = z.infer<typeof IncidentStatusSchema>;

export const TimelineEventSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  detail: z.string().min(1),
  actor: z.string().min(1),
  timestamp: z.string().min(1),
});

export type TimelineEvent = z.infer<typeof TimelineEventSchema>;

export const IncidentItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  severity: IncidentSeveritySchema,
  status: IncidentStatusSchema,
  impact: z.string().min(1),
  owner: z.string().min(1),
  service: z.string().min(1),
  openedAt: z.string().min(1),
  runbookHref: z.string().min(1),
  targetHref: z.string().min(1),
  timeline: z.array(TimelineEventSchema),
});

export type IncidentItem = z.infer<typeof IncidentItemSchema>;
