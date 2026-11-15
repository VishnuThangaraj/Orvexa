import { z } from "zod";

const numericIdSchema = z.union([
  z.string().regex(/^\d+$/, "ID must be a numeric string"),
  z.number().int().positive(),
  z.bigint(),
]);

export const createDirectConversationSchema = z.object({
  recipientId: numericIdSchema,
});

export const createGroupOrChannelSchema = z
  .object({
    name: z
      .string({ error: "Name is required" })
      .trim()
      .min(1, "Name cannot be empty")
      .max(150, "Name cannot exceed 150 characters"),
    description: z.string().trim().max(1000).optional(),
    type: z.enum(["GROUP", "CHANNEL"], {
      error: "Type must be either GROUP or CHANNEL",
    }),
    visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
    participantIds: z.array(numericIdSchema).optional().default([]),
  })
  .refine(
    (data) => {
      if (data.type === "CHANNEL" && !data.visibility) {
        return false;
      }
      return true;
    },
    {
      message: "Visibility (PUBLIC or PRIVATE) is required for CHANNEL type",
      path: ["visibility"],
    },
  );

export const updateConversationSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
  imageId: numericIdSchema.nullable().optional(),
});

export const addParticipantsSchema = z.object({
  userIds: z
    .array(numericIdSchema)
    .min(1, "At least one participant userId is required"),
});

export const updateParticipantRoleSchema = z.object({
  memberRole: z.enum(["ADMIN", "MEMBER"], {
    error: "Role must be ADMIN or MEMBER",
  }),
});

export const updateParticipantSettingsSchema = z.object({
  isMuted: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  isPinned: z.boolean().optional(),
});

export const conversationIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "Invalid conversation ID format"),
});

export const participantUserIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "Invalid conversation ID format"),
  userId: z.string().regex(/^\d+$/, "Invalid user ID format"),
});

export const fetchConversationsQuerySchema = z.object({
  type: z.enum(["DIRECT", "GROUP", "CHANNEL"]).optional(),
  isArchived: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((val) => val === true || val === "true")
    .optional(),
  isPinned: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((val) => val === true || val === "true")
    .optional(),
  search: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  offset: z.coerce.number().int().min(0).default(0),
});

export const sendMessageSchema = z.object({
  content: z
    .string({ error: "Content is required" })
    .trim()
    .min(1, "Message content cannot be empty")
    .max(10000, "Message content cannot exceed 10000 characters"),
  messageType: z
    .enum(["TEXT", "IMAGE", "FILE", "AUDIO", "SYSTEM"])
    .optional()
    .default("TEXT"),
  parentMessageId: numericIdSchema.nullable().optional(),
  attachmentIds: z.array(numericIdSchema).optional().default([]),
});

export const editMessageSchema = z.object({
  content: z
    .string({ error: "Content is required" })
    .trim()
    .min(1, "Message content cannot be empty")
    .max(10000, "Message content cannot exceed 10000 characters"),
});

export const messageIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "Invalid conversation ID format"),
  messageId: z.string().regex(/^\d+$/, "Invalid message ID format"),
});

export const fetchMessagesQuerySchema = z.object({
  cursor: z.string().regex(/^\d+$/).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  parentMessageId: z.string().regex(/^\d+$/).optional(),
});

export const reactionSchema = z.object({
  emoji: z
    .string({ error: "Emoji is required" })
    .trim()
    .min(1, "Emoji cannot be empty")
    .max(32, "Emoji cannot exceed 32 characters"),
});

export const markReadSchema = z.object({
  messageId: numericIdSchema,
});

export const attachmentIdParamSchema = z.object({
  id: numericIdSchema,
});
