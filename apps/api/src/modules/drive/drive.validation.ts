import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "Invalid ID format: must be numeric"),
});

export const createFolderSchema = z.object({
  name: z.string().trim().min(1, "Folder name cannot be empty").max(255, "Folder name is too long"),
  parentFolderId: z
    .union([z.string().regex(/^\d+$/), z.number(), z.null()])
    .optional()
    .transform((val) => (val !== undefined && val !== null ? String(val) : null)),
  color: z.string().trim().max(50).optional().nullable(),
  description: z.string().optional().nullable(),
});

export const updateFolderSchema = z.object({
  name: z.string().trim().min(1, "Folder name cannot be empty").max(255).optional(),
  color: z.string().trim().max(50).optional().nullable(),
  description: z.string().optional().nullable(),
});

export const updateFileSchema = z.object({
  name: z.string().trim().min(1, "File name cannot be empty").max(255).optional(),
  description: z.string().optional().nullable(),
  preventDownload: z.boolean().optional(),
  preventEditorSharing: z.boolean().optional(),
});

export const moveItemsSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.union([z.string().regex(/^\d+$/), z.number()]).transform(String),
        type: z.enum(["file", "folder"]),
      }),
    )
    .min(1, "At least one item must be selected to move"),
  destinationFolderId: z
    .union([z.string().regex(/^\d+$/), z.number(), z.null()])
    .optional()
    .transform((val) => (val !== undefined && val !== null ? String(val) : null)),
});

export const copyItemSchema = z.object({
  fileId: z.union([z.string().regex(/^\d+$/), z.number()]).transform(String),
  targetFolderId: z
    .union([z.string().regex(/^\d+$/), z.number(), z.null()])
    .optional()
    .transform((val) => (val !== undefined && val !== null ? String(val) : null)),
});

export const toggleStarSchema = z.object({
  id: z.union([z.string().regex(/^\d+$/), z.number()]).transform(String),
  type: z.enum(["file", "folder"]),
  isStarred: z.boolean().optional(),
});

export const listItemsQuerySchema = z.object({
  folderId: z
    .union([z.string().regex(/^\d+$/), z.literal("root"), z.literal("")])
    .optional()
    .transform((val) => (val && val !== "root" && val !== "" ? val : null)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(Math.max(parseInt(val, 10) || 50, 1), 200) : 50)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(parseInt(val, 10) || 0, 0) : 0)),
  sortBy: z.enum(["name", "updatedAt", "size", "createdAt"]).optional().default("name"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
  isTrash: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((val) => val === true || val === "true"),
});

export const downloadZipSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.union([z.string().regex(/^\d+$/), z.number()]).transform(String),
        type: z.enum(["file", "folder"]),
      }),
    )
    .min(1, "Select at least one file or folder to download as ZIP"),
});

export const addPermissionSchema = z.object({
  email: z.string().trim().email("Invalid collaborator email format"),
  accessLevel: z.enum(["VIEWER", "COMMENTER", "EDITOR", "MANAGER"]),
  notify: z.boolean().optional().default(false),
});

export const updateLinkSettingsSchema = z.object({
  role: z.enum(["VIEWER", "COMMENTER", "EDITOR"]),
  allowAnonymous: z.boolean().optional().default(false),
  expiresAt: z.string().datetime().optional().nullable(),
  regenerateToken: z.boolean().optional().default(false),
  revoke: z.boolean().optional().default(false),
});

export const createAccessRequestSchema = z.object({
  fileId: z.union([z.string().regex(/^\d+$/), z.number()]).optional().transform((v) => (v ? String(v) : undefined)),
  folderId: z.union([z.string().regex(/^\d+$/), z.number()]).optional().transform((v) => (v ? String(v) : undefined)),
  requestedRole: z.enum(["VIEWER", "COMMENTER", "EDITOR"]).default("VIEWER"),
  message: z.string().max(1000).optional(),
});

export const respondAccessRequestSchema = z.object({
  decision: z.enum(["APPROVE", "DENY"]),
  grantedRole: z.enum(["VIEWER", "COMMENTER", "EDITOR"]).optional(),
});

export const updatePermissionSchema = z.object({
  accessLevel: z.enum(["VIEWER", "COMMENTER", "EDITOR", "MANAGER"]),
});

export const createShortcutSchema = z.object({
  targetType: z.enum(["file", "folder"]),
  targetId: z.union([z.string().regex(/^\d+$/), z.number()]).transform(String),
  parentFolderId: z
    .union([z.string().regex(/^\d+$/), z.number(), z.null()])
    .optional()
    .transform((val) => (val !== undefined && val !== null ? String(val) : null)),
});

export const initUploadSchema = z.object({
  filename: z.string().trim().min(1, "Filename required").max(255),
  mimeType: z.string().trim().min(1, "MIME type required"),
  totalBytes: z.union([z.string(), z.number()]).transform((v) => BigInt(v)),
  folderId: z
    .union([z.string().regex(/^\d+$/), z.number(), z.null()])
    .optional()
    .transform((val) => (val !== undefined && val !== null ? String(val) : null)),
  targetFileId: z
    .union([z.string().regex(/^\d+$/), z.number(), z.null()])
    .optional()
    .transform((val) => (val !== undefined && val !== null ? String(val) : null)),
  chunkSize: z.number().int().min(1024).max(50 * 1024 * 1024).default(5 * 1024 * 1024), // 5MB
});

export const versionIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "Invalid file ID"),
  versionId: z.string().regex(/^\d+$/, "Invalid version ID"),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().optional(),
  type: z
    .enum([
      "image",
      "video",
      "audio",
      "pdf",
      "document",
      "spreadsheet",
      "presentation",
      "folder",
    ])
    .optional(),
  owner: z.enum(["me", "not_me", "anyone"]).optional().default("anyone"),
  modified: z
    .enum(["today", "last7days", "last30days", "thisYear"])
    .optional(),
  sortBy: z.enum(["name", "updatedAt", "size"]).optional().default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(Math.max(parseInt(val, 10) || 50, 1), 200) : 50)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(parseInt(val, 10) || 0, 0) : 0)),
});

export const listActivitiesQuerySchema = z.object({
  fileId: z.union([z.string().regex(/^\d+$/), z.number()]).optional().transform((v) => (v ? String(v) : undefined)),
  folderId: z.union([z.string().regex(/^\d+$/), z.number()]).optional().transform((v) => (v ? String(v) : undefined)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(Math.max(parseInt(val, 10) || 50, 1), 100) : 50)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(parseInt(val, 10) || 0, 0) : 0)),
});

export const saveAssetSchema = z.object({
  assetId: z.union([z.string().regex(/^\d+$/), z.number()]).transform((v) => String(v)),
  filename: z.string().trim().max(255).optional(),
  folderId: z
    .union([z.string().regex(/^\d+$/), z.literal("root"), z.null()])
    .optional()
    .transform((v) => (v && v !== "root" ? String(v) : null)),
});

export const batchShareRecipientsSchema = z.object({
  recipientEmails: z.array(z.string().email()).min(1),
  role: z.enum(["VIEWER", "COMMENTER", "EDITOR"]).optional().default("VIEWER"),
});
