import { z } from 'zod';

export const PlatformOverviewSchema = z.object({
  activeAlerts: z.number().int().nonnegative(),
  clusterHealth: z.string().min(1),
  fleetSync: z.string().min(1),
  managedWorkspaces: z.number().int().nonnegative(),
});

export type PlatformOverview = z.infer<typeof PlatformOverviewSchema>;
