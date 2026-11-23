import { z } from "zod";

export const homeOverviewQuerySchema = z.object({
  timezone: z.string().optional(),
});

export const homeSearchQuerySchema = z.object({
  q: z.string().trim().min(1, "Search query cannot be empty").max(150, "Search query is too long"),
  limit: z.coerce.number().int().min(1).max(20).optional().default(5),
});

export const updateDashboardPreferencesSchema = z.object({
  widgetOrder: z.array(z.string()).optional(),
  hiddenWidgets: z.array(z.string()).optional(),
  collapsedWidgets: z.array(z.string()).optional(),
  widgetSizes: z.record(z.string(), z.string()).optional(),
  summaryStrip: z.boolean().optional(),
});

export type HomeOverviewQueryDto = z.infer<typeof homeOverviewQuerySchema>;
export type HomeSearchQueryDto = z.infer<typeof homeSearchQuerySchema>;
export type UpdateDashboardPreferencesDto = z.infer<typeof updateDashboardPreferencesSchema>;
