import { z } from "zod";

export const createMeetingSchema = z.object({
  title: z.string().trim().max(255).optional(),
  description: z.string().trim().optional().nullable(),
  scheduledStart: z.string().datetime().optional().nullable(),
  scheduledEnd: z.string().datetime().optional().nullable(),
  conversationId: z.union([z.string(), z.number(), z.bigint()]).optional().nullable(),
  isLocked: z.boolean().optional(),
  requireApproval: z.boolean().optional(),
  allowScreenShare: z.boolean().optional(),
  allowChat: z.boolean().optional(),
  allowReactions: z.boolean().optional(),
});

export const updateMeetingSettingsSchema = z.object({
  isLocked: z.boolean().optional(),
  requireApproval: z.boolean().optional(),
  allowScreenShare: z.boolean().optional(),
  allowChat: z.boolean().optional(),
  allowReactions: z.boolean().optional(),
});

export const meetingCodeParamSchema = z.object({
  code: z.string().trim().min(5).max(100),
});

export const sendMessageSchema = z.object({
  content: z.string().trim().min(1, "Message content cannot be empty").max(2000),
});

export const participantActionSchema = z.object({
  userId: z.union([z.string(), z.number(), z.bigint()]),
});

export const knockMeetingSchema = z.object({
  displayName: z.string().trim().max(120).optional(),
});

export const postSignalSchema = z.object({
  toUserId: z.union([z.string(), z.number(), z.bigint()]).optional().nullable(),
  kind: z.enum([
    "offer",
    "answer",
    "ice",
    "media_state",
    "reaction",
    "hand_raise",
    "leave",
  ]),
  payload: z.record(z.string(), z.unknown()).optional().default({}),
});
