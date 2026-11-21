import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { driveController } from "./drive.controller.js";
import {
  idParamSchema,
  createFolderSchema,
  updateFolderSchema,
  updateFileSchema,
  moveItemsSchema,
  copyItemSchema,
  toggleStarSchema,
  listItemsQuerySchema,
  initUploadSchema,
  downloadZipSchema,
  addPermissionSchema,
  updatePermissionSchema,
  updateLinkSettingsSchema,
  createAccessRequestSchema,
  respondAccessRequestSchema,
  createShortcutSchema,
  searchQuerySchema,
  listActivitiesQuerySchema,
  versionIdParamSchema,
  saveAssetSchema,
  batchShareRecipientsSchema,
} from "./drive.validation.js";

const router: Router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per file
    files: 100, // up to 100 files in a single batch / folder upload
  },
});

const chunkUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per chunk
  },
});

// Storage usage
router.get("/storage", authenticate, driveController.getStorage);

// Multipart file & folder upload
router.post("/upload", authenticate, upload.any(), driveController.uploadFiles);

// Resumable / chunked upload sessions
router.post(
  "/upload/init",
  authenticate,
  validate(initUploadSchema, "body"),
  driveController.initUploadSession,
);
router.patch(
  "/upload/:sessionId/chunk",
  authenticate,
  chunkUpload.single("chunk"),
  driveController.uploadChunk,
);
router.post(
  "/upload/:sessionId/complete",
  authenticate,
  driveController.completeUploadSession,
);
router.post(
  "/upload/:sessionId/abort",
  authenticate,
  driveController.abortUploadSession,
);

// Streamed multi-item ZIP download
router.post(
  "/download-zip",
  authenticate,
  validate(downloadZipSchema, "body"),
  driveController.downloadZip,
);

// List files, folders, shortcuts
router.get(
  "/files",
  authenticate,
  validate(listItemsQuerySchema, "query"),
  driveController.listItems,
);

// Folders CRUD
router.post(
  "/folders",
  authenticate,
  validate(createFolderSchema, "body"),
  driveController.createFolder,
);

router.get(
  "/folders/:id",
  authenticate,
  validate(idParamSchema, "params"),
  driveController.getFolder,
);

router.patch(
  "/folders/:id",
  authenticate,
  validate(idParamSchema, "params"),
  validate(updateFolderSchema, "body"),
  driveController.updateFolder,
);

router.delete(
  "/folders/:id",
  authenticate,
  validate(idParamSchema, "params"),
  driveController.deleteFolder,
);

router.post(
  "/folders/:id/restore",
  authenticate,
  validate(idParamSchema, "params"),
  driveController.restoreFolder,
);

router.delete(
  "/folders/:id/permanent",
  authenticate,
  validate(idParamSchema, "params"),
  driveController.permanentDeleteFolder,
);

// Files CRUD
router.get(
  "/files/:id",
  authenticate,
  validate(idParamSchema, "params"),
  driveController.getFile,
);

router.get(
  "/files/:id/download",
  authenticate,
  validate(idParamSchema, "params"),
  driveController.downloadFile,
);

router.get(
  "/files/:id/stream",
  authenticate,
  validate(idParamSchema, "params"),
  driveController.streamFile,
);

router.get(
  "/files/:id/preview",
  authenticate,
  validate(idParamSchema, "params"),
  driveController.streamFile,
);

router.get(
  "/files/:id/thumbnail",
  authenticate,
  validate(idParamSchema, "params"),
  driveController.getThumbnail,
);

router.patch(
  "/files/:id",
  authenticate,
  validate(idParamSchema, "params"),
  validate(updateFileSchema, "body"),
  driveController.updateFile,
);

router.delete(
  "/files/:id",
  authenticate,
  validate(idParamSchema, "params"),
  driveController.deleteFile,
);

router.post(
  "/files/:id/restore",
  authenticate,
  validate(idParamSchema, "params"),
  driveController.restoreFile,
);

router.delete(
  "/files/:id/permanent",
  authenticate,
  validate(idParamSchema, "params"),
  driveController.permanentDeleteFile,
);

// Move & Copy
router.post(
  "/move",
  authenticate,
  validate(moveItemsSchema, "body"),
  driveController.moveItems,
);

router.post(
  "/copy",
  authenticate,
  validate(copyItemSchema, "body"),
  driveController.copyItem,
);

// Star/favorite
router.post(
  "/star",
  authenticate,
  validate(toggleStarSchema, "body"),
  driveController.toggleStar,
);

// Collaborator search
router.get("/users", authenticate, driveController.searchUsers);

// Shared with me
router.get("/shared-with-me", authenticate, driveController.listSharedWithMe);

// File permissions & links
router.get(
  "/files/:fileId/permissions",
  authenticate,
  driveController.listPermissions,
);
router.post(
  "/files/:fileId/permissions",
  authenticate,
  validate(addPermissionSchema, "body"),
  driveController.addPermission,
);
router.get("/files/:fileId/link", authenticate, driveController.listPermissions);
router.post(
  "/files/:fileId/link",
  authenticate,
  validate(updateLinkSettingsSchema, "body"),
  driveController.updateShareLink,
);

// Folder permissions & links
router.get(
  "/folders/:folderId/permissions",
  authenticate,
  driveController.listPermissions,
);
router.post(
  "/folders/:folderId/permissions",
  authenticate,
  validate(addPermissionSchema, "body"),
  driveController.addPermission,
);
router.get("/folders/:folderId/link", authenticate, driveController.listPermissions);
router.post(
  "/folders/:folderId/link",
  authenticate,
  validate(updateLinkSettingsSchema, "body"),
  driveController.updateShareLink,
);

// Resolve share link
router.get("/links/:token/resolve", authenticate, driveController.resolveShareLink);
router.get("/s/:token", authenticate, driveController.resolveShareLink);

// Update/remove permission by ID
router.patch(
  "/permissions/:permissionId",
  authenticate,
  validate(updatePermissionSchema, "body"),
  driveController.updatePermission,
);
router.delete(
  "/permissions/:permissionId",
  authenticate,
  driveController.removePermission,
);

// Access requests
router.post(
  "/access-requests",
  authenticate,
  validate(createAccessRequestSchema, "body"),
  driveController.createAccessRequest,
);
router.get("/access-requests", authenticate, driveController.listAccessRequests);
router.post(
  "/access-requests/:id/respond",
  authenticate,
  validate(respondAccessRequestSchema, "body"),
  driveController.respondAccessRequest,
);

// Shortcuts
router.post(
  "/shortcuts",
  authenticate,
  validate(createShortcutSchema, "body"),
  driveController.createShortcut,
);
router.delete("/shortcuts/:id", authenticate, driveController.deleteShortcut);

// Trash Empty & Purge
router.delete("/trash/empty", authenticate, driveController.emptyTrash);
router.post("/trash/purge", authenticate, driveController.purgeTrash);

// Full-Text & Multi-Filter Search
router.get(
  "/search",
  authenticate,
  validate(searchQuerySchema, "query"),
  driveController.searchItems,
);

// Recent Items
router.get("/recent", authenticate, driveController.listRecent);

// Starred Items
router.get("/starred", authenticate, driveController.listStarred);

// Activities Timeline
router.get(
  "/activities",
  authenticate,
  validate(listActivitiesQuerySchema, "query"),
  driveController.listActivities,
);

// File Versions
router.post(
  "/files/:id/versions",
  authenticate,
  validate(idParamSchema, "params"),
  upload.single("file"),
  driveController.uploadNewVersion,
);
router.get(
  "/files/:id/versions",
  authenticate,
  validate(idParamSchema, "params"),
  driveController.listVersions,
);
router.get(
  "/files/:id/versions/:versionId/download",
  authenticate,
  validate(versionIdParamSchema, "params"),
  driveController.downloadVersion,
);
router.post(
  "/files/:id/versions/:versionId/restore",
  authenticate,
  validate(versionIdParamSchema, "params"),
  driveController.restoreVersion,
);
router.delete(
  "/files/:id/versions/:versionId",
  authenticate,
  validate(versionIdParamSchema, "params"),
  driveController.deleteVersion,
);

// Cross-module integrations: Save Asset to Drive & Batch Share
router.post(
  "/save-asset",
  authenticate,
  validate(saveAssetSchema, "body"),
  driveController.saveAsset,
);

router.post(
  "/files/:id/share-recipients",
  authenticate,
  validate(idParamSchema, "params"),
  validate(batchShareRecipientsSchema, "body"),
  driveController.batchShareRecipients,
);

export default router;
