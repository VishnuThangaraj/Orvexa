import type { Request, Response, NextFunction } from "express";
import AppError from "../../common/errors/AppError.js";
import { sendResponse } from "../../common/utils/response.js";
import { driveService } from "./drive.service.js";

export class DriveController {
  listItems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const query = req.query as any;

      const result = await driveService.listItems(userId, {
        folderId: query.folderId,
        limit: query.limit,
        offset: query.offset,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        isTrash: query.isTrash,
      });

      return sendResponse(res, 200, "Drive items retrieved successfully", result);
    } catch (error) {
      next(error);
    }
  };

  createFolder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const result = await driveService.createFolder(userId, req.body);
      return sendResponse(res, 201, "Folder created successfully", result);
    } catch (error) {
      next(error);
    }
  };

  getFolder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const folderId = BigInt(req.params.id as string);
      const result = await driveService.getFolder(userId, folderId);
      return sendResponse(res, 200, "Folder retrieved successfully", result);
    } catch (error) {
      next(error);
    }
  };

  updateFolder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const folderId = BigInt(req.params.id as string);
      const result = await driveService.updateFolder(userId, folderId, req.body);
      return sendResponse(res, 200, "Folder updated successfully", result);
    } catch (error) {
      next(error);
    }
  };

  deleteFolder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const folderId = BigInt(req.params.id as string);
      const result = await driveService.deleteFolder(userId, folderId);
      return sendResponse(res, 200, result.message, result);
    } catch (error) {
      next(error);
    }
  };

  restoreFolder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const folderId = BigInt(req.params.id as string);
      const result = await driveService.restoreFolder(userId, folderId);
      return sendResponse(res, 200, result.message, result);
    } catch (error) {
      next(error);
    }
  };

  permanentDeleteFolder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const folderId = BigInt(req.params.id as string);
      const result = await driveService.permanentDeleteFolder(userId, folderId);
      return sendResponse(res, 200, result.message, result);
    } catch (error) {
      next(error);
    }
  };

  getFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const fileId = BigInt(req.params.id as string);
      const linkToken = req.query.token as string | undefined;
      const result = await driveService.getFile(userId, fileId, linkToken);
      return sendResponse(res, 200, "File retrieved successfully", result);
    } catch (error) {
      next(error);
    }
  };

  updateFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const fileId = BigInt(req.params.id as string);
      const result = await driveService.updateFile(userId, fileId, req.body);
      return sendResponse(res, 200, "File updated successfully", result);
    } catch (error) {
      next(error);
    }
  };

  deleteFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const fileId = BigInt(req.params.id as string);
      const result = await driveService.deleteFile(userId, fileId);
      return sendResponse(res, 200, result.message, result);
    } catch (error) {
      next(error);
    }
  };

  restoreFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const fileId = BigInt(req.params.id as string);
      const result = await driveService.restoreFile(userId, fileId);
      return sendResponse(res, 200, result.message, result);
    } catch (error) {
      next(error);
    }
  };

  permanentDeleteFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const fileId = BigInt(req.params.id as string);
      const result = await driveService.permanentDeleteFile(userId, fileId);
      return sendResponse(res, 200, result.message, result);
    } catch (error) {
      next(error);
    }
  };

  moveItems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const result = await driveService.moveItems(userId, req.body);
      return sendResponse(res, 200, result.message, result);
    } catch (error) {
      next(error);
    }
  };

  copyItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const result = await driveService.copyItem(userId, req.body);
      return sendResponse(res, 201, "File copied successfully", result);
    } catch (error) {
      next(error);
    }
  };

  toggleStar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const result = await driveService.toggleStar(userId, req.body);
      return sendResponse(res, 200, "Star status updated", result);
    } catch (error) {
      next(error);
    }
  };

  getStorage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const result = await driveService.getUserStorage(userId);
      return sendResponse(res, 200, "Storage usage retrieved successfully", result);
    } catch (error) {
      next(error);
    }
  };

  uploadFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const targetFolderId = (req.body.folderId || req.query.folderId) as string | undefined;

      const rawFiles = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);
      if (!rawFiles || rawFiles.length === 0) {
        throw new AppError("No files uploaded", 400);
      }

      let relativePaths: string[] = [];
      if (req.body.paths) {
        try {
          relativePaths =
            typeof req.body.paths === "string" ? JSON.parse(req.body.paths) : req.body.paths;
        } catch {
          relativePaths = Array.isArray(req.body.paths) ? req.body.paths : [req.body.paths];
        }
      }

      const filesToUpload = rawFiles.map((f, idx) => ({
        originalname: f.originalname,
        buffer: f.buffer,
        mimetype: f.mimetype,
        size: f.size,
        relativePath: relativePaths[idx] || (f as any).relativePath || undefined,
      }));

      const result = await driveService.uploadFiles(userId, filesToUpload, targetFolderId);
      return sendResponse(res, 201, "Files uploaded successfully", result);
    } catch (error) {
      next(error);
    }
  };

  initUploadSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const result = await driveService.initUploadSession(userId, req.body);
      return sendResponse(res, 201, "Upload session initialized", result);
    } catch (error) {
      next(error);
    }
  };

  uploadChunk = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const sessionId = req.params.sessionId as string;
      const chunkIndexRaw =
        req.params.chunkIndex ||
        req.query.chunkIndex ||
        req.body?.chunkIndex ||
        req.headers["x-chunk-index"];

      if (chunkIndexRaw === undefined || chunkIndexRaw === null) {
        throw new AppError("Chunk index is required", 400);
      }
      const chunkIndex = parseInt(chunkIndexRaw as string, 10);
      const chunkBuffer = req.file?.buffer || (req as any).rawBody || req.body;

      if (!chunkBuffer || !Buffer.isBuffer(chunkBuffer)) {
        throw new AppError("Chunk binary buffer is required", 400);
      }

      const result = await driveService.uploadChunk(userId, sessionId, chunkIndex, chunkBuffer);
      return sendResponse(res, 200, "Chunk uploaded successfully", result);
    } catch (error) {
      next(error);
    }
  };

  completeUploadSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const sessionId = req.params.sessionId as string;
      const result = await driveService.completeUploadSession(userId, sessionId);
      return sendResponse(res, 200, "Upload session completed", result);
    } catch (error) {
      next(error);
    }
  };

  abortUploadSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const sessionId = req.params.sessionId as string;
      const result = await driveService.abortUploadSession(userId, sessionId);
      return sendResponse(res, 200, result.message, result);
    } catch (error) {
      next(error);
    }
  };

  downloadFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const fileId = BigInt(req.params.id as string);
      const token = req.query.token as string | undefined;

      const result = await driveService.getFileDownloadStream(userId, fileId, token);

      res.setHeader("Content-Type", result.mimeType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(result.filename)}"; filename*=UTF-8''${encodeURIComponent(result.filename)}`,
      );
      res.setHeader("Content-Length", result.size);

      result.stream.on("error", (streamErr) => {
        if (!res.headersSent) {
          next(streamErr);
        } else {
          res.destroy(streamErr);
        }
      });

      result.stream.pipe(res);
    } catch (error) {
      next(error);
    }
  };

  streamFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const fileId = BigInt(req.params.id as string);
      const token = req.query.token as string | undefined;
      const range = req.headers.range;

      const result = await driveService.getFileStreamForPreview(userId, fileId, {
        range,
        linkToken: token,
      });

      res.setHeader("Content-Type", result.mimeType);
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${encodeURIComponent(result.filename)}"`,
      );

      if (result.status === 206) {
        res.status(206);
        res.setHeader("Content-Range", result.contentRange!);
        res.setHeader("Content-Length", result.contentLength);
      } else {
        res.status(200);
        res.setHeader("Content-Length", result.contentLength);
      }

      result.stream.on("error", (streamErr) => {
        if (!res.headersSent) {
          next(streamErr);
        } else {
          res.destroy(streamErr);
        }
      });

      result.stream.pipe(res);
    } catch (error) {
      next(error);
    }
  };

  getThumbnail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const fileId = BigInt(req.params.id as string);
      const token = req.query.token as string | undefined;
      const width = req.query.width ? parseInt(req.query.width as string, 10) : 200;
      const height = req.query.height ? parseInt(req.query.height as string, 10) : 200;

      const result = await driveService.getFileThumbnail(userId, fileId, {
        width,
        height,
        linkToken: token,
      });

      if (!result) {
        return res.status(404).json({ error: "Thumbnail not available for this file type" });
      }

      res.setHeader("Content-Type", result.mimeType);
      res.setHeader("Cache-Control", "private, max-age=86400");
      res.status(200).send(result.buffer);
    } catch (error) {
      next(error);
    }
  };

  downloadZip = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      await driveService.streamZipDownload(userId, req.body.items, res);
    } catch (error) {
      next(error);
    }
  };

  searchUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const query = (req.query.q as string) || "";
      const result = await driveService.searchUsers(query, userId);
      return sendResponse(res, 200, "Users retrieved successfully", result);
    } catch (error) {
      next(error);
    }
  };

  listPermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const fileId = req.params.fileId ? BigInt(req.params.fileId as string) : undefined;
      const folderId = req.params.folderId ? BigInt(req.params.folderId as string) : undefined;

      const result = await driveService.listPermissions(userId, { fileId, folderId });
      return sendResponse(res, 200, "Permissions retrieved successfully", result);
    } catch (error) {
      next(error);
    }
  };

  addPermission = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const fileId = req.params.fileId ? BigInt(req.params.fileId as string) : undefined;
      const folderId = req.params.folderId ? BigInt(req.params.folderId as string) : undefined;

      const result = await driveService.addPermission(userId, { fileId, folderId }, req.body);
      return sendResponse(res, 201, "Permission added successfully", result);
    } catch (error) {
      next(error);
    }
  };

  updatePermission = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const permissionId = BigInt(req.params.permissionId as string);

      const result = await driveService.updatePermission(
        userId,
        permissionId,
        req.body.accessLevel,
      );
      return sendResponse(res, 200, "Permission updated successfully", result);
    } catch (error) {
      next(error);
    }
  };

  removePermission = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const permissionId = BigInt(req.params.permissionId as string);

      const result = await driveService.removePermission(userId, permissionId);
      return sendResponse(res, 200, result.message, result);
    } catch (error) {
      next(error);
    }
  };

  updateShareLink = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const fileId = req.params.fileId ? BigInt(req.params.fileId as string) : undefined;
      const folderId = req.params.folderId ? BigInt(req.params.folderId as string) : undefined;

      const result = await driveService.updateShareLink(userId, { fileId, folderId }, req.body);
      return sendResponse(res, 200, "Share link updated successfully", result);
    } catch (error) {
      next(error);
    }
  };

  resolveShareLink = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const { token } = req.params;
      const result = await driveService.resolveShareLink(userId, token as string);
      return sendResponse(res, 200, "Share link resolved successfully", result);
    } catch (error) {
      next(error);
    }
  };

  createAccessRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const fileId = req.body.fileId ? BigInt(req.body.fileId) : undefined;
      const folderId = req.body.folderId ? BigInt(req.body.folderId) : undefined;

      const result = await driveService.createAccessRequest(userId, {
        fileId,
        folderId,
        requestedRole: req.body.requestedRole,
        message: req.body.message,
      });
      return sendResponse(res, 201, "Access request created", result);
    } catch (error) {
      next(error);
    }
  };

  listAccessRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const result = await driveService.listAccessRequests(userId);
      return sendResponse(res, 200, "Access requests retrieved", result);
    } catch (error) {
      next(error);
    }
  };

  respondAccessRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const requestId = BigInt(req.params.id as string);

      const result = await driveService.respondAccessRequest(
        userId,
        requestId,
        req.body.decision,
        req.body.grantedRole,
      );
      return sendResponse(res, 200, "Access request updated", result);
    } catch (error) {
      next(error);
    }
  };

  listSharedWithMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await driveService.listSharedWithMe(userId, { limit, offset });
      return sendResponse(res, 200, "Shared items retrieved successfully", result);
    } catch (error) {
      next(error);
    }
  };

  createShortcut = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const targetId = BigInt(req.body.targetId);
      const parentFolderId = req.body.parentFolderId ? BigInt(req.body.parentFolderId) : null;

      const result = await driveService.createShortcut(userId, {
        targetType: req.body.targetType,
        targetId,
        parentFolderId,
      });
      return sendResponse(res, 201, "Shortcut created successfully", result);
    } catch (error) {
      next(error);
    }
  };

  deleteShortcut = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const shortcutId = BigInt(req.params.id as string);

      const result = await driveService.deleteShortcut(userId, shortcutId);
      return sendResponse(res, 200, result.message, result);
    } catch (error) {
      next(error);
    }
  };

  emptyTrash = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const result = await driveService.emptyTrash(userId);
      return sendResponse(res, 200, result.message, result);
    } catch (error) {
      next(error);
    }
  };

  purgeTrash = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const retentionDays = req.body?.retentionDays ? Number(req.body.retentionDays) : 30;
      const result = await driveService.purgeExpiredTrash(retentionDays);
      return sendResponse(res, 200, "Trash purged successfully", result);
    } catch (error) {
      next(error);
    }
  };

  uploadNewVersion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const fileId = BigInt(req.params.id as string);
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded for versioning" });
      }

      const result = await driveService.uploadNewVersion(userId, fileId, {
        originalname: file.originalname,
        buffer: file.buffer,
        mimetype: file.mimetype,
        size: file.size,
      });

      return sendResponse(res, 201, "New version uploaded successfully", result);
    } catch (error) {
      next(error);
    }
  };

  listVersions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const fileId = BigInt(req.params.id as string);
      const result = await driveService.listFileVersions(userId, fileId);
      return sendResponse(res, 200, "File versions retrieved", result);
    } catch (error) {
      next(error);
    }
  };

  downloadVersion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const fileId = BigInt(req.params.id as string);
      const versionId = BigInt(req.params.versionId as string);
      const token = req.query.token as string | undefined;

      const result = await driveService.getFileVersionDownloadStream(
        userId,
        fileId,
        versionId,
        token,
      );

      res.setHeader("Content-Type", result.mimeType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(result.filename)}"; filename*=UTF-8''${encodeURIComponent(result.filename)}`,
      );
      res.setHeader("Content-Length", result.size);

      result.stream.on("error", (streamErr) => {
        if (!res.headersSent) {
          next(streamErr);
        } else {
          res.destroy(streamErr);
        }
      });

      result.stream.pipe(res);
    } catch (error) {
      next(error);
    }
  };

  restoreVersion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const fileId = BigInt(req.params.id as string);
      const versionId = BigInt(req.params.versionId as string);

      const result = await driveService.restoreFileVersion(userId, fileId, versionId);
      return sendResponse(res, 200, result.message, result);
    } catch (error) {
      next(error);
    }
  };

  deleteVersion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const fileId = BigInt(req.params.id as string);
      const versionId = BigInt(req.params.versionId as string);

      const result = await driveService.deleteFileVersion(userId, fileId, versionId);
      return sendResponse(res, 200, result.message, result);
    } catch (error) {
      next(error);
    }
  };

  searchItems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const result = await driveService.searchItems(userId, req.query as any);
      return sendResponse(res, 200, "Search results retrieved", result);
    } catch (error) {
      next(error);
    }
  };

  listActivities = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const fileId = req.query.fileId ? BigInt(req.query.fileId as string) : undefined;
      const folderId = req.query.folderId ? BigInt(req.query.folderId as string) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const offset = req.query.offset ? Number(req.query.offset) : undefined;

      const result = await driveService.listActivities(userId, {
        fileId,
        folderId,
        limit,
        offset,
      });
      return sendResponse(res, 200, "Activities retrieved", result);
    } catch (error) {
      next(error);
    }
  };

  listRecent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const result = await driveService.listRecent(userId, limit);
      return sendResponse(res, 200, "Recent files retrieved", result);
    } catch (error) {
      next(error);
    }
  };

  listStarred = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const result = await driveService.listStarred(userId);
      return sendResponse(res, 200, "Starred items retrieved", result);
    } catch (error) {
      next(error);
    }
  };

  saveAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const result = await driveService.saveAssetToDrive(userId, req.body);
      return sendResponse(res, 201, "Asset saved to Drive successfully", result);
    } catch (error) {
      next(error);
    }
  };

  batchShareRecipients = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.id);
      const fileId = req.params.id as string;
      const { recipientEmails, role } = req.body;
      const result = await driveService.batchEnsureRecipientsAccess(userId, {
        fileIds: [fileId],
        recipientEmails,
        role,
      });
      return sendResponse(res, 200, "Recipients access verified/granted", result);
    } catch (error) {
      next(error);
    }
  };
}

export const driveController = new DriveController();
export default driveController;
