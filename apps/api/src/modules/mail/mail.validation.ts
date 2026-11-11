import { z } from "zod";

export const attachmentMetadataSchema = z.object({
  assetId: z.union([z.string(), z.number()]).optional(),
  publicId: z.string().trim().min(1).optional(),
  cloudinaryAssetId: z.string().trim().optional(),
  resourceType: z.enum(["IMAGE", "VIDEO", "RAW"]).optional(),
  deliveryType: z.enum(["UPLOAD", "AUTHENTICATED", "PRIVATE"]).optional(),
  format: z.string().trim().optional(),
  originalFilename: z.string().trim().min(1).optional(),
  mimeType: z.string().trim().min(1).optional(),
  bytes: z.union([z.number(), z.string()]).optional(),
  secureUrl: z.string().url().optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
});

export const attachmentItemSchema = z.union([
  z.string().trim().min(1),
  z.number(),
  attachmentMetadataSchema,
]);

export const sendMailSchema = z.object({
  to: z
    .union([
      z.string().trim().min(1, "Recipient 'to' cannot be empty"),
      z
        .array(z.string().trim().min(1, "Recipient cannot be empty"))
        .min(1, "At least one recipient is required in 'to'"),
    ])
    .transform((val) => (Array.isArray(val) ? val : [val])),

  cc: z
    .union([
      z.string().trim().min(1),
      z.array(z.string().trim().min(1)),
    ])
    .optional()
    .transform((val) => (val ? (Array.isArray(val) ? val : [val]) : [])),

  bcc: z
    .union([
      z.string().trim().min(1),
      z.array(z.string().trim().min(1)),
    ])
    .optional()
    .transform((val) => (val ? (Array.isArray(val) ? val : [val]) : [])),

  subject: z
    .string()
    .max(255, "Subject must not exceed 255 characters")
    .optional()
    .default(""),

  body: z.string().optional().default(""),

  parentMessageId: z
    .union([z.string().regex(/^\d+$/, "Invalid parent message ID format"), z.number()])
    .optional(),

  attachmentIds: z
    .array(z.union([z.string().regex(/^\d+$/, "Invalid asset ID format"), z.number()]))
    .optional(),

  attachments: z.array(attachmentItemSchema).optional(),

  draftId: z
    .union([z.string().regex(/^\d+$/, "Invalid draft ID format"), z.number()])
    .optional(),
});

export const attachmentIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "Invalid attachment ID format"),
});

export const fetchInboxQuerySchema = z.object({
  page: z
    .union([z.string().regex(/^\d+$/, "Page must be a positive integer"), z.number().int().positive()])
    .transform((val) => Number(val))
    .optional()
    .default(1),
  limit: z
    .union([z.string().regex(/^\d+$/, "Limit must be a positive integer"), z.number().int().positive()])
    .transform((val) => Number(val))
    .optional()
    .default(20),
  search: z.string().trim().optional(),
  isRead: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((val) => (val === true || val === "true" ? true : val === false || val === "false" ? false : undefined))
    .optional(),
  isStarred: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((val) => (val === true || val === "true" ? true : val === false || val === "false" ? false : undefined))
    .optional(),
});

export type SendMailInput = z.infer<typeof sendMailSchema>;
export type FetchInboxQuery = z.infer<typeof fetchInboxQuerySchema>;
