import { z } from "zod";

const eventTypeEnum = z.enum([
  "PERSONAL",
  "WORK",
  "MEETING",
  "HOLIDAY",
  "OUT_OF_OFFICE",
  "REMINDER",
  "TASK",
]);

const eventVisibilityEnum = z.enum([
  "DEFAULT",
  "PUBLIC",
  "PRIVATE",
  "CONFIDENTIAL",
]);

const invitationStatusEnum = z.enum([
  "PENDING",
  "ACCEPTED",
  "DECLINED",
  "TENTATIVE",
]);

export const calendarAttachmentInputSchema = z.object({
  fileId: z.union([z.string(), z.number()]).nullable().optional(),
  assetId: z.union([z.string(), z.number()]).nullable().optional(),
  title: z.string().trim().min(1).max(255),
  fileUrl: z.string().nullable().optional(),
  mimeType: z.string().nullable().optional(),
  sizeBytes: z.union([z.string(), z.number()]).nullable().optional(),
});

export const createEventSchema = z.object({
  title: z.string().trim().min(1, "Event title is required").max(255),
  description: z.string().trim().nullable().optional(),
  startTime: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  endTime: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  isAllDay: z.boolean().optional().default(false),
  timezone: z.string().trim().optional(),
  location: z.string().trim().max(255).nullable().optional(),
  calendarId: z.union([z.string(), z.number()]).nullable().optional(),
  color: z.string().trim().max(50).nullable().optional(),
  eventType: eventTypeEnum.optional().default("PERSONAL"),
  visibility: eventVisibilityEnum.optional().default("PRIVATE"),
  recurrenceRule: z.string().trim().nullable().optional(),
  meetingId: z.union([z.string(), z.number()]).nullable().optional(),
  guestUserIds: z.array(z.union([z.string(), z.number()])).optional(),
  reminders: z
    .array(
      z.object({
        minutesBefore: z.number().int().min(0).max(10080), // up to 7 days
      }),
    )
    .optional(),
  attachments: z.array(calendarAttachmentInputSchema).optional(),
});

export const updateEventSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().nullable().optional(),
  startTime: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  endTime: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  isAllDay: z.boolean().optional(),
  timezone: z.string().trim().optional(),
  location: z.string().trim().max(255).nullable().optional(),
  calendarId: z.union([z.string(), z.number()]).nullable().optional(),
  color: z.string().trim().max(50).nullable().optional(),
  eventType: eventTypeEnum.optional(),
  visibility: eventVisibilityEnum.optional(),
  recurrenceRule: z.string().trim().nullable().optional(),
  meetingId: z.union([z.string(), z.number()]).nullable().optional(),
  recurrenceMode: z.enum(["SINGLE", "FOLLOWING", "ALL"]).optional().default("ALL"),
  targetInstanceDate: z.string().optional(),
  guestUserIds: z.array(z.union([z.string(), z.number()])).optional(),
  reminders: z
    .array(
      z.object({
        minutesBefore: z.number().int().min(0).max(10080),
      }),
    )
    .optional(),
  attachments: z.array(calendarAttachmentInputSchema).optional(),
});

export const fetchEventsQuerySchema = z.object({
  start: z.string().min(1, "start query parameter is required"),
  end: z.string().min(1, "end query parameter is required"),
  calendarIds: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      if (Array.isArray(val)) return val;
      return val.split(",").map((s) => s.trim()).filter(Boolean);
    }),
  search: z.string().trim().optional(),
  includeDeclined: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => {
      if (typeof val === "boolean") return val;
      if (typeof val === "string") return val.toLowerCase() !== "false";
      return true;
    }),
});

export const createCalendarSchema = z.object({
  name: z.string().trim().min(1, "Calendar name is required").max(255),
  color: z.string().trim().max(50).optional().default("#039be5"),
});

export const updateCalendarSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  color: z.string().trim().max(50).optional(),
  isVisible: z.boolean().optional(),
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Task title is required").max(255),
  details: z.string().trim().nullable().optional(),
  dueDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).nullable().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  details: z.string().trim().nullable().optional(),
  dueDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).nullable().optional(),
  isCompleted: z.boolean().optional(),
});

export const fetchTasksQuerySchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
  includeCompleted: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => {
      if (typeof val === "boolean") return val;
      if (typeof val === "string") return val.toLowerCase() !== "false";
      return true;
    }),
});

export const updateSettingsSchema = z.object({
  defaultView: z.enum(["day", "week", "month", "year", "schedule", "4days"]).optional(),
  showWeekends: z.boolean().optional(),
  showDeclinedEvents: z.boolean().optional(),
  showCompletedTasks: z.boolean().optional(),
  timezone: z.string().trim().optional(),
  hiddenCalendarIds: z.string().nullable().optional(),
});

export const rsvpSchema = z.object({
  responseStatus: invitationStatusEnum,
});
