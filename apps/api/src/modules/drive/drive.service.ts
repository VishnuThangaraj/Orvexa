import crypto from "node:crypto";
import path from "node:path";
import mime from "mime-types";
import sharp from "sharp";
import { ZipArchive } from "archiver";
import type { Response } from "express";
import type { Prisma } from "../../generated/prisma/client.js";
import prisma from "../../infrastructure/database/prisma.js";
import AppError from "../../common/errors/AppError.js";
import { driveRepository, type PaginationOptions } from "./drive.repository.js";
import { drivePermissionService } from "./drive.permission.js";
import {
  deleteAssetBlob,
  getStorageProvider,
  resolveAssetBuffer,
  resolveAssetStream,
  resolveCloudThumbnailBuffer,
  type StoragePutResult,
} from "../../infrastructure/storage/index.js";

function parseOptionalBigInt(value?: string | null, label = "ID"): bigint | null {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === "root" || trimmed === "null" || trimmed === "undefined") {
    return null;
  }
  if (!/^\d+$/.test(trimmed)) {
    throw new AppError(`Invalid ${label}`, 400);
  }
  return BigInt(trimmed);
}

function buildFileAssetData(
  userId: bigint,
  stored: StoragePutResult,
  meta: {
    originalFilename: string;
    mimeType: string;
    fallbackStorageKey: string;
    fallbackResourceType: "IMAGE" | "VIDEO" | "RAW";
    fallbackFormat: string | null;
  },
) {
  const backend = stored.storageBackend ?? "LOCAL";
  return {
    publicId: stored.publicId ?? meta.fallbackStorageKey,
    cloudinaryAssetId: stored.cloudinaryAssetId ?? null,
    resourceType: stored.resourceType ?? meta.fallbackResourceType,
    deliveryType: stored.deliveryType ?? "AUTHENTICATED",
    version: stored.version ?? null,
    originalFilename: meta.originalFilename,
    mimeType: meta.mimeType,
    bytes: BigInt(stored.size),
    format: stored.format ?? meta.fallbackFormat,
    secureUrl: stored.secureUrl ?? null,
    width: stored.width ?? null,
    height: stored.height ?? null,
    storageBackend: backend,
    storagePath:
      backend === "CLOUDINARY"
        ? (stored.publicId ?? meta.fallbackStorageKey)
        : meta.fallbackStorageKey,
    sha256: stored.sha256,
    uploadedBy: userId,
  };
}

function getTotalQuota(): bigint {
  if (process.env.DRIVE_TOTAL_QUOTA_BYTES) {
    try {
      return BigInt(process.env.DRIVE_TOTAL_QUOTA_BYTES);
    } catch {
      // fallback
    }
  }
  return 15n * 1024n * 1024n * 1024n; // 15 GB
}

function inferResourceType(mimeType: string): "IMAGE" | "VIDEO" | "RAW" {
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.startsWith("video/")) return "VIDEO";
  return "RAW";
}

function sanitizeStorageFilename(filename: string): string {
  const base = path.basename(filename).replace(/[^a-zA-Z0-9._\-]/g, "_");
  return base.length > 0 ? base : "unnamed_file";
}

export class DriveService {
  /**
   * List folders, files, and shortcuts inside a folder (or root).
   */
  async listItems(
    userId: bigint,
    options: {
      folderId?: string | null;
      limit?: number;
      offset?: number;
      sortBy?: "name" | "updatedAt" | "size" | "createdAt";
      sortOrder?: "asc" | "desc";
      isTrash?: boolean;
    },
  ) {
    const isTrash = Boolean(options.isTrash);
    const targetFolderId =
      !isTrash && options.folderId && options.folderId !== "root"
        ? BigInt(options.folderId)
        : null;

    let breadcrumbs: Array<{ id: string; name: string }> = isTrash
      ? [{ id: "trash", name: "Trash" }]
      : [];
    let currentFolder: any = null;

    if (!isTrash && targetFolderId !== null) {
      currentFolder = await driveRepository.findFolderById(targetFolderId);
      if (!currentFolder) {
        throw new AppError("Folder not found", 404);
      }
      if (currentFolder.deletedAt) {
        throw new AppError("Cannot view contents of a trashed folder", 400);
      }

      await drivePermissionService.assertAccess(
        userId,
        { folderId: targetFolderId },
        "VIEWER",
      );

      breadcrumbs = await driveRepository.getBreadcrumbs(targetFolderId);
      await driveRepository.recordRecentAccess(userId, { folderId: targetFolderId });
    }

    const pagination: PaginationOptions = {
      limit: options.limit || 50,
      offset: options.offset || 0,
      sortBy: options.sortBy || "name",
      sortOrder: options.sortOrder || "asc",
    };

    // Find folders and files
    const [folders, files, shortcuts] = await Promise.all([
      driveRepository.findSubfolders(userId, targetFolderId, pagination, isTrash),
      driveRepository.findFiles(userId, targetFolderId, pagination, isTrash),
      isTrash ? Promise.resolve([]) : driveRepository.findShortcuts(userId, targetFolderId),
    ]);

    // Check star status
    const fileIds = files.map((f) => f.id);
    const folderIds = folders.map((f) => f.id);
    const { starredFileIds, starredFolderIds } = await driveRepository.getFavoriteStatus(
      userId,
      fileIds,
      folderIds,
    );

    return {
      currentFolder: currentFolder
        ? {
            id: String(currentFolder.id),
            name: currentFolder.name,
            color: currentFolder.color,
            description: currentFolder.description,
            owner: currentFolder.owner,
            createdAt: currentFolder.createdAt,
            updatedAt: currentFolder.updatedAt,
          }
        : null,
      breadcrumbs,
      folders: folders.map((f) => ({
        id: String(f.id),
        name: f.name,
        color: f.color,
        description: f.description,
        owner: f.owner,
        isStarred: starredFolderIds.has(String(f.id)),
        deletedAt: f.deletedAt,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
        type: "folder" as const,
      })),
      files: files.map((f) => ({
        id: String(f.id),
        name: f.name,
        description: f.description,
        currentVersion: f.currentVersion,
        preventDownload: f.preventDownload,
        preventEditorSharing: f.preventEditorSharing,
        owner: f.owner,
        deletedAt: f.deletedAt,
        asset: {
          id: String(f.currentAsset.id),
          mimeType: f.currentAsset.mimeType,
          bytes: String(f.currentAsset.bytes),
          format: f.currentAsset.format,
          resourceType: f.currentAsset.resourceType,
          secureUrl: f.currentAsset.secureUrl,
        },
        isStarred: starredFileIds.has(String(f.id)),
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
        type: "file" as const,
      })),
      shortcuts: shortcuts.map((s) => ({
        id: String(s.id),
        name: s.name,
        targetFile: s.targetFile
          ? {
              id: String(s.targetFile.id),
              name: s.targetFile.name,
              mimeType: s.targetFile.currentAsset.mimeType,
              bytes: String(s.targetFile.currentAsset.bytes),
              owner: s.targetFile.owner,
            }
          : null,
        targetFolder: s.targetFolder
          ? {
              id: String(s.targetFolder.id),
              name: s.targetFolder.name,
              color: s.targetFolder.color,
              owner: s.targetFolder.owner,
            }
          : null,
        createdAt: s.createdAt,
        type: "shortcut" as const,
      })),
    };
  }

  /**
   * Create folder with collision resolution and permission verification.
   */
  async createFolder(
    userId: bigint,
    dto: {
      name: string;
      parentFolderId?: string | null;
      color?: string | null;
      description?: string | null;
    },
  ) {
    const parentId = dto.parentFolderId ? BigInt(dto.parentFolderId) : null;

    if (parentId !== null) {
      await drivePermissionService.assertAccess(userId, { folderId: parentId }, "EDITOR");
    }

    const uniqueName = await driveRepository.resolveUniqueFolderName(
      parentId,
      userId,
      dto.name.trim(),
    );

    const folder = await driveRepository.createFolder({
      name: uniqueName,
      ownerId: userId,
      parentFolderId: parentId,
      color: dto.color,
      description: dto.description,
    });

    await driveRepository.recordActivity({
      folderId: folder.id,
      userId,
      action: "CREATED",
      details: { name: folder.name, parentFolderId: parentId ? String(parentId) : null },
    });

    const breadcrumbs = await driveRepository.getBreadcrumbs(folder.id);

    return {
      id: String(folder.id),
      name: folder.name,
      color: folder.color,
      description: folder.description,
      owner: folder.owner,
      breadcrumbs,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    };
  }

  /**
   * Get folder details + breadcrumbs.
   */
  async getFolder(userId: bigint, folderId: bigint) {
    const folder = await driveRepository.findFolderById(folderId);
    if (!folder) {
      throw new AppError("Folder not found", 404);
    }

    const perm = await drivePermissionService.assertAccess(userId, { folderId }, "VIEWER");
    const breadcrumbs = await driveRepository.getBreadcrumbs(folderId);
    await driveRepository.recordRecentAccess(userId, { folderId });

    const isStarred = (
      await driveRepository.getFavoriteStatus(userId, [], [folderId])
    ).starredFolderIds.has(String(folderId));

    return {
      id: String(folder.id),
      name: folder.name,
      color: folder.color,
      description: folder.description,
      owner: folder.owner,
      breadcrumbs,
      isStarred,
      effectiveRole: perm.effectiveRole,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    };
  }

  /**
   * Rename or update folder settings.
   */
  async updateFolder(
    userId: bigint,
    folderId: bigint,
    dto: { name?: string; color?: string | null; description?: string | null },
  ) {
    const folder = await driveRepository.findFolderById(folderId);
    if (!folder) {
      throw new AppError("Folder not found", 404);
    }

    await drivePermissionService.assertAccess(userId, { folderId }, "EDITOR");

    let finalName = folder.name;
    if (dto.name && dto.name.trim() !== folder.name) {
      finalName = await driveRepository.resolveUniqueFolderName(
        folder.parentFolderId,
        folder.ownerId,
        dto.name.trim(),
        folderId,
      );
    }

    const updated = await driveRepository.updateFolder(folderId, {
      name: finalName,
      color: dto.color,
      description: dto.description,
    });

    await driveRepository.recordActivity({
      folderId,
      userId,
      action: dto.name ? "RENAMED" : "UPDATED",
      details: { oldName: folder.name, newName: finalName },
    });

    return {
      id: String(updated.id),
      name: updated.name,
      color: updated.color,
      description: updated.description,
      owner: updated.owner,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Move folder to Trash (soft delete).
   */
  async deleteFolder(userId: bigint, folderId: bigint) {
    const folder = await driveRepository.findFolderById(folderId);
    if (!folder) {
      throw new AppError("Folder not found", 404);
    }

    await drivePermissionService.assertAccess(userId, { folderId }, "EDITOR");
    await driveRepository.softDeleteFolder(folderId, userId);

    await driveRepository.recordActivity({
      folderId,
      userId,
      action: "TRASHED",
      details: { name: folder.name },
    });

    return { success: true, message: "Folder moved to Trash" };
  }

  /**
   * Restore folder from Trash.
   */
  async restoreFolder(userId: bigint, folderId: bigint) {
    const folder = await driveRepository.findFolderById(folderId);
    if (!folder) {
      throw new AppError("Folder not found", 404);
    }

    await drivePermissionService.assertAccess(userId, { folderId }, "EDITOR");
    await driveRepository.restoreFolder(folderId);

    await driveRepository.recordActivity({
      folderId,
      userId,
      action: "RESTORED",
      details: { name: folder.name },
    });

    return { success: true, message: "Folder restored from Trash" };
  }

  /**
   * Permanently delete folder and all contents (Owner only).
   */
  async permanentDeleteFolder(userId: bigint, folderId: bigint) {
    const folder = await driveRepository.findFolderById(folderId);
    if (!folder) {
      throw new AppError("Folder not found", 404);
    }

    if (folder.ownerId !== userId) {
      throw new AppError("Only the folder owner can delete it forever", 403);
    }

    // Collect all descendant folder IDs to delete
    const descendantFolderIds: Array<{ id: bigint }> = await prisma.$queryRaw`
      WITH RECURSIVE folder_descendants AS (
        SELECT id FROM drive_folders WHERE id = ${folderId}
        UNION ALL
        SELECT f.id FROM drive_folders f
        INNER JOIN folder_descendants fd ON f.parent_folder_id = fd.id
      )
      SELECT id FROM folder_descendants;
    `;

    const allFolderIds = descendantFolderIds.map((r) => BigInt(r.id));

    // Find all files inside these folders
    const files = await prisma.driveFile.findMany({
      where: { folderId: { in: allFolderIds } },
      include: { currentAsset: true },
    });

    // Delete files in transaction
    await prisma.$transaction(async (tx) => {
      // Delete drive files
      await tx.driveFile.deleteMany({
        where: { folderId: { in: allFolderIds } },
      });
      // Delete folders
      await tx.driveFolder.deleteMany({
        where: { id: { in: allFolderIds } },
      });
    });

    // Cleanup storage blobs for assets
    for (const f of files) {
      if (f.currentAsset) {
        await deleteAssetBlob(f.currentAsset).catch(() => {});
      }
    }

    return { success: true, message: "Folder and contents permanently deleted" };
  }

  /**
   * Get file details.
   */
  async getFile(userId: bigint, fileId: bigint, linkToken?: string) {
    const file = await driveRepository.findFileById(fileId);
    if (!file) {
      throw new AppError("File not found", 404);
    }

    const perm = await drivePermissionService.assertAccess(
      userId,
      { fileId },
      "VIEWER",
      linkToken,
    );

    await driveRepository.recordRecentAccess(userId, { fileId });

    const isStarred = (
      await driveRepository.getFavoriteStatus(userId, [fileId], [])
    ).starredFileIds.has(String(fileId));

    let breadcrumbs: Array<{ id: string; name: string }> = [];
    if (file.folderId) {
      breadcrumbs = await driveRepository.getBreadcrumbs(file.folderId);
    }

    return {
      id: String(file.id),
      name: file.name,
      description: file.description,
      currentVersion: file.currentVersion,
      preventDownload: file.preventDownload,
      preventEditorSharing: file.preventEditorSharing,
      owner: file.owner,
      asset: {
        id: String(file.currentAsset.id),
        mimeType: file.currentAsset.mimeType,
        bytes: String(file.currentAsset.bytes),
        format: file.currentAsset.format,
        resourceType: file.currentAsset.resourceType,
        secureUrl: file.currentAsset.secureUrl,
        createdAt: file.currentAsset.createdAt,
      },
      breadcrumbs,
      isStarred,
      effectiveRole: perm.effectiveRole,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };
  }

  /**
   * Rename or update file metadata.
   */
  async updateFile(
    userId: bigint,
    fileId: bigint,
    dto: {
      name?: string;
      description?: string | null;
      preventDownload?: boolean;
      preventEditorSharing?: boolean;
    },
  ) {
    const file = await driveRepository.findFileById(fileId);
    if (!file) {
      throw new AppError("File not found", 404);
    }

    // Changing security restrictions requires OWNER
    if (dto.preventDownload !== undefined || dto.preventEditorSharing !== undefined) {
      if (file.ownerId !== userId) {
        throw new AppError("Only the file owner can modify access restrictions", 403);
      }
    } else {
      await drivePermissionService.assertAccess(userId, { fileId }, "EDITOR");
    }

    let finalName = file.name;
    if (dto.name && dto.name.trim() !== file.name) {
      finalName = await driveRepository.resolveUniqueFileName(
        file.folderId,
        file.ownerId,
        dto.name.trim(),
        fileId,
      );
    }

    const updated = await driveRepository.updateFile(fileId, {
      name: finalName,
      description: dto.description,
      preventDownload: dto.preventDownload,
      preventEditorSharing: dto.preventEditorSharing,
    });

    await driveRepository.recordActivity({
      fileId,
      userId,
      action: dto.name ? "RENAMED" : "UPDATED",
      details: { oldName: file.name, newName: finalName },
    });

    return {
      id: String(updated.id),
      name: updated.name,
      description: updated.description,
      preventDownload: updated.preventDownload,
      preventEditorSharing: updated.preventEditorSharing,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Move file to Trash.
   */
  async deleteFile(userId: bigint, fileId: bigint) {
    const file = await driveRepository.findFileById(fileId);
    if (!file) {
      throw new AppError("File not found", 404);
    }

    await drivePermissionService.assertAccess(userId, { fileId }, "EDITOR");
    await driveRepository.softDeleteFile(fileId, userId);

    await driveRepository.recordActivity({
      fileId,
      userId,
      action: "TRASHED",
      details: { name: file.name },
    });

    return { success: true, message: "File moved to Trash" };
  }

  /**
   * Restore file from Trash.
   */
  async restoreFile(userId: bigint, fileId: bigint) {
    const file = await driveRepository.findFileById(fileId);
    if (!file) {
      throw new AppError("File not found", 404);
    }

    await drivePermissionService.assertAccess(userId, { fileId }, "EDITOR");
    await driveRepository.restoreFile(fileId);

    await driveRepository.recordActivity({
      fileId,
      userId,
      action: "RESTORED",
      details: { name: file.name },
    });

    return { success: true, message: "File restored from Trash" };
  }

  /**
   * Permanently delete file and versions (Owner only).
   */
  async permanentDeleteFile(userId: bigint, fileId: bigint) {
    const file = await driveRepository.findFileById(fileId);
    if (!file) {
      throw new AppError("File not found", 404);
    }

    if (file.ownerId !== userId) {
      throw new AppError("Only the file owner can delete it forever", 403);
    }

    const versions = await prisma.driveFileVersion.findMany({
      where: { fileId },
      include: { asset: true },
    });

    await prisma.$transaction(async (tx) => {
      await tx.driveFileVersion.deleteMany({ where: { fileId } });
      await tx.driveFile.delete({ where: { id: fileId } });
    });

    // Cleanup blobs
    if (file.currentAsset) {
      await deleteAssetBlob(file.currentAsset).catch(() => {});
    }
    for (const v of versions) {
      if (v.asset) {
        await deleteAssetBlob(v.asset).catch(() => {});
      }
    }

    return { success: true, message: "File permanently deleted" };
  }

  /**
   * Move files or folders into a new destination folder (with cycle check).
   */
  async moveItems(
    userId: bigint,
    dto: {
      items: Array<{ id: string; type: "file" | "folder" }>;
      destinationFolderId?: string | null;
    },
  ) {
    const destId = dto.destinationFolderId ? BigInt(dto.destinationFolderId) : null;

    if (destId !== null) {
      await drivePermissionService.assertAccess(userId, { folderId: destId }, "EDITOR");
    }

    for (const item of dto.items) {
      const itemId = BigInt(item.id);

      if (item.type === "folder") {
        await drivePermissionService.assertAccess(userId, { folderId: itemId }, "EDITOR");

        // Circular move check
        const isCircular = await drivePermissionService.checkCircularMove(itemId, destId);
        if (isCircular) {
          throw new AppError("Cannot move a folder into itself or any of its subfolders", 400);
        }

        const folder = await driveRepository.findFolderById(itemId);
        if (folder) {
          const uniqueName = await driveRepository.resolveUniqueFolderName(
            destId,
            folder.ownerId,
            folder.name,
            itemId,
          );

          await driveRepository.updateFolder(itemId, {
            parentFolderId: destId,
            name: uniqueName,
          });

          await driveRepository.recordActivity({
            folderId: itemId,
            userId,
            action: "MOVED",
            details: { destinationFolderId: destId ? String(destId) : null },
          });
        }
      } else if (item.type === "file") {
        await drivePermissionService.assertAccess(userId, { fileId: itemId }, "EDITOR");

        const file = await driveRepository.findFileById(itemId);
        if (file) {
          const uniqueName = await driveRepository.resolveUniqueFileName(
            destId,
            file.ownerId,
            file.name,
            itemId,
          );

          await driveRepository.updateFile(itemId, {
            folderId: destId,
            name: uniqueName,
          });

          await driveRepository.recordActivity({
            fileId: itemId,
            userId,
            action: "MOVED",
            details: { destinationFolderId: destId ? String(destId) : null },
          });
        }
      }
    }

    return { success: true, message: `Successfully moved ${dto.items.length} item(s)` };
  }

  /**
   * Make a copy of a file.
   */
  async copyItem(userId: bigint, dto: { fileId: string; targetFolderId?: string | null }) {
    const sourceFileId = BigInt(dto.fileId);
    const targetFolderId = dto.targetFolderId ? BigInt(dto.targetFolderId) : null;

    const sourceFile = await driveRepository.findFileById(sourceFileId);
    if (!sourceFile) {
      throw new AppError("Source file not found", 404);
    }

    await drivePermissionService.assertAccess(userId, { fileId: sourceFileId }, "VIEWER");

    if (targetFolderId !== null) {
      await drivePermissionService.assertAccess(userId, { folderId: targetFolderId }, "EDITOR");
    }

    // Check user quota
    const { usedBytes } = await driveRepository.getUserStorageUsage(userId);
    if (usedBytes + sourceFile.currentAsset.bytes > getTotalQuota()) {
      throw new AppError("Storage quota exceeded. Cannot copy file.", 400);
    }

    const uniqueCopyName = await driveRepository.resolveUniqueFileName(
      targetFolderId,
      userId,
      `Copy of ${sourceFile.name}`,
    );

    const newFile = await driveRepository.createFile({
      name: uniqueCopyName,
      ownerId: userId,
      folderId: targetFolderId,
      assetId: sourceFile.assetId,
      description: sourceFile.description,
      searchableContent: sourceFile.searchableContent,
    });

    await driveRepository.recordActivity({
      fileId: newFile.id,
      userId,
      action: "COPIED",
      details: { sourceFileId: String(sourceFileId), name: newFile.name },
    });

    return {
      id: String(newFile.id),
      name: newFile.name,
      owner: newFile.owner,
      asset: newFile.currentAsset,
      createdAt: newFile.createdAt,
    };
  }

  /**
   * Toggle star/favorite status.
   */
  async toggleStar(
    userId: bigint,
    dto: { id: string; type: "file" | "folder"; isStarred?: boolean },
  ) {
    const itemId = BigInt(dto.id);
    const target = dto.type === "file" ? { fileId: itemId } : { folderId: itemId };

    await drivePermissionService.assertAccess(userId, target, "VIEWER");
    const isStarred = await driveRepository.toggleFavorite(userId, target, dto.isStarred);

    return { id: dto.id, isStarred };
  }

  /**
   * Real user storage usage calculation.
   */
  async getUserStorage(userId: bigint) {
    const { usedBytes, fileCount } = await driveRepository.getUserStorageUsage(userId);
    const totalBytes = getTotalQuota();
    const usagePercentage = Number((usedBytes * 10000n) / totalBytes) / 100;

    return {
      usedBytes: String(usedBytes),
      totalBytes: String(totalBytes),
      usagePercentage,
      fileCount,
    };
  }

  /**
   * Helper to ensure a subfolder hierarchy exists for folder uploads.
   * e.g. "FolderA/FolderB" -> returns folderId of FolderB
   */
  async ensureFolderPath(
    userId: bigint,
    baseFolderId: bigint | null,
    folderPath: string,
  ): Promise<bigint | null> {
    const parts = folderPath.split("/").map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) return baseFolderId;

    let currentParentId = baseFolderId;

    for (const part of parts) {
      const existing = await prisma.driveFolder.findFirst({
        where: {
          ownerId: userId,
          parentFolderId: currentParentId,
          name: part,
          deletedAt: null,
        },
      });

      if (existing) {
        currentParentId = existing.id;
      } else {
        const created = await driveRepository.createFolder({
          name: part,
          ownerId: userId,
          parentFolderId: currentParentId,
        });
        currentParentId = created.id;
      }
    }

    return currentParentId;
  }

  /**
   * Multipart file(s) upload.
   */
  async uploadFiles(
    userId: bigint,
    files: Array<{
      originalname: string;
      buffer: Buffer;
      mimetype?: string;
      size: number;
      relativePath?: string;
    }>,
    targetFolderId?: string | null,
  ) {
    if (!files || files.length === 0) {
      throw new AppError("No files uploaded", 400);
    }

    const baseFolderId = parseOptionalBigInt(targetFolderId, "folderId");
    if (baseFolderId !== null) {
      await drivePermissionService.assertAccess(userId, { folderId: baseFolderId }, "EDITOR");
    }

    // 1. Check storage quota
    const totalNewBytes = files.reduce((acc, f) => acc + BigInt(f.size || f.buffer.length), 0n);
    const { usedBytes } = await driveRepository.getUserStorageUsage(userId);
    const totalQuota = getTotalQuota();
    if (usedBytes + totalNewBytes > totalQuota) {
      throw new AppError(
        `Storage quota exceeded. Free space remaining: ${Number(totalQuota - usedBytes) / (1024 * 1024)}MB`,
        400,
      );
    }

    const storage = getStorageProvider();
    const uploadedFiles: any[] = [];

    for (const file of files) {
      // Determine destination folder (handling folder upload relativePath)
      let resolvedFolderId = baseFolderId;
      if (file.relativePath) {
        const folderDir = path.dirname(file.relativePath);
        if (folderDir && folderDir !== "." && folderDir !== "/") {
          resolvedFolderId = await this.ensureFolderPath(userId, baseFolderId, folderDir);
        }
      }

      // Sniff MIME type
      const detectedMime =
        mime.lookup(file.originalname) || file.mimetype || "application/octet-stream";
      const resourceType = inferResourceType(detectedMime);
      const ext = path.extname(file.originalname).replace(/^\./, "");

      // Extract searchable text if text file (up to 100KB)
      let searchableContent: string | null = null;
      if (
        detectedMime.startsWith("text/") ||
        detectedMime === "application/json" ||
        detectedMime === "application/javascript" ||
        detectedMime === "application/xml"
      ) {
        searchableContent = file.buffer.toString(
          "utf-8",
          0,
          Math.min(file.buffer.length, 100 * 1024),
        );
      }

      // Resolve unique filename in destination
      const uniqueName = await driveRepository.resolveUniqueFileName(
        resolvedFolderId,
        userId,
        file.originalname,
      );

      // Save blob to storage under unguessable UUID path
      const safeStorageName = sanitizeStorageFilename(file.originalname);
      const storageKey = `drive/${userId}/${Date.now()}_${crypto.randomUUID()}_${safeStorageName}`;
      const putRes = await storage.putBuffer(storageKey, file.buffer, {
        mimeType: detectedMime,
        filename: file.originalname,
      });

      // Create FileAsset
      const asset = await prisma.fileAsset.create({
        data: buildFileAssetData(userId, putRes, {
          originalFilename: file.originalname,
          mimeType: detectedMime,
          fallbackStorageKey: storageKey,
          fallbackResourceType: resourceType,
          fallbackFormat: ext || null,
        }),
      });

      // Create DriveFile
      const driveFile = await driveRepository.createFile({
        name: uniqueName,
        ownerId: userId,
        folderId: resolvedFolderId,
        assetId: asset.id,
        searchableContent,
      });

      // Record activity
      await driveRepository.recordActivity({
        fileId: driveFile.id,
        folderId: resolvedFolderId ?? undefined,
        userId,
        action: "UPLOADED",
        details: { name: driveFile.name, size: putRes.size },
      });

      uploadedFiles.push({
        id: String(driveFile.id),
        name: driveFile.name,
        currentVersion: driveFile.currentVersion,
        owner: driveFile.owner,
        asset: {
          id: String(asset.id),
          mimeType: asset.mimeType,
          bytes: String(asset.bytes),
          format: asset.format,
          resourceType: asset.resourceType,
          secureUrl: asset.secureUrl,
        },
        folderId: resolvedFolderId ? String(resolvedFolderId) : null,
        createdAt: driveFile.createdAt,
      });
    }

    return uploadedFiles;
  }

  /**
   * Initialize a chunked / resumable upload session.
   */
  async initUploadSession(
    userId: bigint,
    dto: {
      filename: string;
      mimeType: string;
      totalBytes: bigint;
      folderId?: string | null;
      targetFileId?: string | null;
      chunkSize: number;
    },
  ) {
    const folderId = dto.folderId ? BigInt(dto.folderId) : null;
    const targetFileId = dto.targetFileId ? BigInt(dto.targetFileId) : null;

    if (folderId !== null) {
      await drivePermissionService.assertAccess(userId, { folderId }, "EDITOR");
    }

    if (targetFileId !== null) {
      await drivePermissionService.assertAccess(userId, { fileId: targetFileId }, "EDITOR");
    }

    // Quota check
    const { usedBytes } = await driveRepository.getUserStorageUsage(userId);
    if (usedBytes + dto.totalBytes > getTotalQuota()) {
      throw new AppError("Storage quota exceeded", 400);
    }

    const sessionId = crypto.randomUUID();
    const totalChunks = Math.ceil(Number(dto.totalBytes) / dto.chunkSize);
    const safeStorageName = sanitizeStorageFilename(dto.filename);
    const storageKey = `drive/${userId}/${Date.now()}_${sessionId}_${safeStorageName}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const session = await prisma.driveUploadSession.create({
      data: {
        id: sessionId,
        userId,
        folderId,
        targetFileId,
        filename: dto.filename,
        mimeType: dto.mimeType,
        totalBytes: dto.totalBytes,
        chunkSize: dto.chunkSize,
        totalChunks,
        completedChunks: [],
        storageKey,
        expiresAt,
      },
    });

    return {
      sessionId: session.id,
      chunkSize: session.chunkSize,
      totalChunks: session.totalChunks,
      expiresAt: session.expiresAt,
    };
  }

  /**
   * Upload an individual chunk.
   */
  async uploadChunk(
    userId: bigint,
    sessionId: string,
    chunkIndex: number,
    buffer: Buffer,
  ) {
    const session = await prisma.driveUploadSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new AppError("Upload session not found", 404);
    }

    if (session.status !== "IN_PROGRESS") {
      throw new AppError(`Upload session is already ${session.status.toLowerCase()}`, 400);
    }

    if (session.expiresAt < new Date()) {
      throw new AppError("Upload session expired", 400);
    }

    if (chunkIndex < 0 || chunkIndex >= session.totalChunks) {
      throw new AppError(`Invalid chunk index ${chunkIndex}`, 400);
    }

    const storage = getStorageProvider();
    await storage.saveChunk(sessionId, chunkIndex, buffer);

    const completedSet = new Set(session.completedChunks);
    if (!completedSet.has(chunkIndex)) {
      completedSet.add(chunkIndex);
      const updatedCompleted = Array.from(completedSet).sort((a, b) => a - b);
      const newUploadedBytes = session.uploadedBytes + BigInt(buffer.length);

      await prisma.driveUploadSession.update({
        where: { id: sessionId },
        data: {
          completedChunks: updatedCompleted,
          uploadedBytes: newUploadedBytes,
        },
      });
    }

    return {
      sessionId,
      chunkIndex,
      completedChunks: completedSet.size,
      totalChunks: session.totalChunks,
    };
  }

  /**
   * Complete chunked upload session, stitch file and register asset.
   */
  async completeUploadSession(userId: bigint, sessionId: string) {
    const session = await prisma.driveUploadSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new AppError("Upload session not found", 404);
    }

    if (session.status !== "IN_PROGRESS") {
      throw new AppError(`Session already ${session.status.toLowerCase()}`, 400);
    }

    const completedSet = new Set(session.completedChunks);
    for (let i = 0; i < session.totalChunks; i++) {
      if (!completedSet.has(i)) {
        throw new AppError(`Cannot complete upload: missing chunk ${i}`, 400);
      }
    }

    const storage = getStorageProvider();
    const stitched = await storage.stitchChunks(
      sessionId,
      session.totalChunks,
      session.storageKey,
      { mimeType: session.mimeType, filename: session.filename },
    );

    const ext = path.extname(session.filename).replace(/^\./, "");
    const resourceType = inferResourceType(session.mimeType);

    // Create FileAsset
    const asset = await prisma.fileAsset.create({
      data: buildFileAssetData(userId, stitched, {
        originalFilename: session.filename,
        mimeType: session.mimeType,
        fallbackStorageKey: session.storageKey,
        fallbackResourceType: resourceType,
        fallbackFormat: ext || null,
      }),
    });

    let resultFile: any;

    if (session.targetFileId) {
      // New version of existing file!
      const targetFile = await driveRepository.findFileById(session.targetFileId);
      if (!targetFile) {
        throw new AppError("Target file not found for new version", 404);
      }

      const newVersionNum = targetFile.currentVersion + 1;

      // Save previous version in drive_file_versions
      await prisma.driveFileVersion.create({
        data: {
          fileId: targetFile.id,
          versionNumber: targetFile.currentVersion,
          assetId: targetFile.assetId,
          uploadedBy: userId,
        },
      });

      // Update DriveFile to point to new asset
      resultFile = await driveRepository.updateFile(targetFile.id, {
        assetId: asset.id,
        currentVersion: newVersionNum,
      });

      await driveRepository.recordActivity({
        fileId: targetFile.id,
        folderId: targetFile.folderId ?? undefined,
        userId,
        action: "UPLOADED_VERSION",
        details: { version: newVersionNum, name: targetFile.name },
      });
    } else {
      // New file
      const uniqueName = await driveRepository.resolveUniqueFileName(
        session.folderId,
        userId,
        session.filename,
      );

      resultFile = await driveRepository.createFile({
        name: uniqueName,
        ownerId: userId,
        folderId: session.folderId,
        assetId: asset.id,
      });

      await driveRepository.recordActivity({
        fileId: resultFile.id,
        folderId: session.folderId ?? undefined,
        userId,
        action: "UPLOADED",
        details: { name: resultFile.name, size: stitched.size },
      });
    }

    // Mark session COMPLETED
    await prisma.driveUploadSession.update({
      where: { id: sessionId },
      data: { status: "COMPLETED" },
    });

    return {
      id: String(resultFile.id),
      name: resultFile.name,
      currentVersion: resultFile.currentVersion,
      asset: {
        id: String(asset.id),
        mimeType: asset.mimeType,
        bytes: String(asset.bytes),
        format: asset.format,
      },
    };
  }

  /**
   * Abort chunked upload session and clean up temp files.
   */
  async abortUploadSession(userId: bigint, sessionId: string) {
    const session = await prisma.driveUploadSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new AppError("Upload session not found", 404);
    }

    const storage = getStorageProvider();
    await storage.cleanupChunks(sessionId);

    await prisma.driveUploadSession.update({
      where: { id: sessionId },
      data: { status: "ABORTED" },
    });

    return { success: true, message: "Upload session aborted" };
  }

  /**
   * Get file stream for download with permission and preventDownload enforcement.
   */
  async getFileDownloadStream(userId: bigint, fileId: bigint, linkToken?: string) {
    const file = await driveRepository.findFileById(fileId);
    if (!file) {
      throw new AppError("File not found", 404);
    }
    if (file.deletedAt) {
      throw new AppError("Cannot download a trashed file", 400);
    }

    const perm = await drivePermissionService.assertAccess(
      userId,
      { fileId },
      "VIEWER",
      linkToken,
    );

    // Enforce preventDownload for viewers/commenters
    if (
      file.preventDownload &&
      (perm.effectiveRole === "VIEWER" || perm.effectiveRole === "COMMENTER")
    ) {
      throw new AppError("Download disabled by the file owner", 403);
    }

    const { stream, totalLength, mimeType } = await resolveAssetStream(file.currentAsset);

    this.recordRecentAccess(userId, { fileId }).catch(() => {});

    await driveRepository.recordActivity({
      fileId,
      userId,
      action: "DOWNLOADED",
      details: { name: file.name, size: Number(file.currentAsset.bytes) },
    });

    return {
      stream,
      filename: file.name,
      mimeType: mimeType || file.currentAsset.mimeType,
      size: totalLength || Number(file.currentAsset.bytes),
    };
  }

  /**
   * Get file stream for preview or media playback with optional byte range support.
   */
  async getFileStreamForPreview(
    userId: bigint,
    fileId: bigint,
    options?: { range?: string; linkToken?: string },
  ) {
    const file = await driveRepository.findFileById(fileId);
    if (!file) {
      throw new AppError("File not found", 404);
    }
    if (file.deletedAt) {
      throw new AppError("Cannot preview a trashed file", 400);
    }

    await drivePermissionService.assertAccess(
      userId,
      { fileId },
      "VIEWER",
      options?.linkToken,
    );

    this.recordRecentAccess(userId, { fileId }).catch(() => {});

    const totalBytes = Number(file.currentAsset.bytes);
    const mimeType = file.currentAsset.mimeType;

    // Handle HTTP Range header if present
    if (options?.range) {
      const match = options.range.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        const start = parseInt(match[1], 10);
        let end = match[2] ? parseInt(match[2], 10) : totalBytes - 1;

        if (isNaN(start) || start >= totalBytes) {
          throw new AppError("Requested range not satisfiable", 416);
        }
        if (end >= totalBytes) {
          end = totalBytes - 1;
        }

        const { stream } = await resolveAssetStream(file.currentAsset, { start, end });
        const contentLength = end - start + 1;

        return {
          stream,
          status: 206 as const,
          contentRange: `bytes ${start}-${end}/${totalBytes}`,
          contentLength,
          mimeType,
          filename: file.name,
        };
      }
    }

    const { stream, contentLength, totalLength } = await resolveAssetStream(file.currentAsset);
    return {
      stream,
      status: 200 as const,
      contentLength: totalBytes || contentLength || totalLength,
      mimeType,
      filename: file.name,
    };
  }

  /**
   * Generate or retrieve an image thumbnail using sharp.
   */
  async getFileThumbnail(
    userId: bigint,
    fileId: bigint,
    options?: { width?: number; height?: number; linkToken?: string },
  ) {
    const file = await driveRepository.findFileById(fileId);
    if (!file) {
      throw new AppError("File not found", 404);
    }
    if (file.deletedAt) {
      throw new AppError("Cannot preview a trashed file", 400);
    }

    await drivePermissionService.assertAccess(
      userId,
      { fileId },
      "VIEWER",
      options?.linkToken,
    );

    const mimeType = file.currentAsset.mimeType.toLowerCase();
    if (!mimeType.startsWith("image/") || mimeType === "image/svg+xml") {
      return null;
    }

    const width = Math.min(Math.max(options?.width || 200, 16), 1024);
    const height = Math.min(Math.max(options?.height || 200, 16), 1024);

    const cloudThumb = await resolveCloudThumbnailBuffer(file.currentAsset, width, height);
    if (cloudThumb) {
      return cloudThumb;
    }

    const buffer = await resolveAssetBuffer(file.currentAsset);
    const resizedBuffer = await sharp(buffer)
      .resize(width, height, { fit: "cover", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    return {
      buffer: resizedBuffer,
      mimeType: "image/webp",
    };
  }

  /**
   * Stream a ZIP file containing multiple files and/or whole folders directly to the Express response.
   * Never buffers the archive into memory.
   */
  async streamZipDownload(
    userId: bigint,
    items: Array<{ id: string; type: "file" | "folder" }>,
    res: Response,
  ) {
    const archive = new ZipArchive({ zlib: { level: 5 } });

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="drive_download_${Date.now()}.zip"`,
    );

    archive.pipe(res);

    archive.on("error", (err: any) => {
      console.error("Archive stream error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate ZIP archive" });
      }
    });

    for (const item of items) {
      const itemId = BigInt(item.id);

      if (item.type === "file") {
        const file = await driveRepository.findFileById(itemId);
        if (!file || file.deletedAt) continue;

        try {
          const perm = await drivePermissionService.assertAccess(
            userId,
            { fileId: itemId },
            "VIEWER",
          );
          if (
            file.preventDownload &&
            (perm.effectiveRole === "VIEWER" || perm.effectiveRole === "COMMENTER")
          ) {
            continue; // Skip restricted files
          }
        } catch {
          continue; // Skip inaccessible files
        }

        if (file.currentAsset) {
          const { stream } = await resolveAssetStream(file.currentAsset);
          archive.append(stream, { name: file.name });
        }
      } else if (item.type === "folder") {
        const rootFolder = await driveRepository.findFolderById(itemId);
        if (!rootFolder || rootFolder.deletedAt) continue;

        try {
          await drivePermissionService.assertAccess(
            userId,
            { folderId: itemId },
            "VIEWER",
          );
        } catch {
          continue;
        }

        // Recursively fetch all descendant folders and their paths
        const folderTree: Array<{ id: bigint; path: string }> = await prisma.$queryRaw`
          WITH RECURSIVE ft AS (
            SELECT id, parent_folder_id, name, name::text AS path
            FROM drive_folders
            WHERE id = ${itemId} AND deleted_at IS NULL
            UNION ALL
            SELECT f.id, f.parent_folder_id, f.name, (ft.path || '/' || f.name)::text AS path
            FROM drive_folders f
            INNER JOIN ft ON f.parent_folder_id = ft.id
            WHERE f.deleted_at IS NULL
          )
          SELECT id, path FROM ft;
        `;

        const folderMap = new Map<string, string>();
        for (const row of folderTree) {
          folderMap.set(String(row.id), row.path);
        }

        const folderIds = folderTree.map((r) => BigInt(r.id));
        const files = await prisma.driveFile.findMany({
          where: {
            folderId: { in: folderIds },
            deletedAt: null,
          },
          include: { currentAsset: true },
        });

        for (const file of files) {
          if (file.preventDownload) continue;
          if (!file.currentAsset) continue;

          const parentPath = file.folderId
            ? folderMap.get(String(file.folderId)) || rootFolder.name
            : rootFolder.name;
          const entryPath = `${parentPath}/${file.name}`;

          const { stream } = await resolveAssetStream(file.currentAsset);
          archive.append(stream, { name: entryPath });
        }
      }
    }

    await archive.finalize();
  }

  /**
   * Search users by name/email for collaborator autocomplete.
   */
  async searchUsers(query: string, excludeUserId?: bigint) {
    const q = query.trim();
    if (!q) return [];

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { fullName: { contains: q, mode: "insensitive" } },
          { username: { contains: q, mode: "insensitive" } },
        ],
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
        isActive: true,
      },
      take: 10,
      select: {
        id: true,
        fullName: true,
        email: true,
        username: true,
      },
    });

    return users.map((u) => ({
      id: String(u.id),
      fullName: u.fullName,
      email: u.email,
      username: u.username,
    }));
  }

  /**
   * List collaborators, general link settings, and owner for a file or folder.
   */
  async listPermissions(
    userId: bigint,
    target: { fileId?: bigint; folderId?: bigint },
  ) {
    const perm = await drivePermissionService.assertAccess(
      userId,
      target,
      "VIEWER",
    );

    let owner: any = null;
    let preventEditorSharing = false;

    if (target.fileId) {
      const file = await driveRepository.findFileById(target.fileId);
      if (!file) throw new AppError("File not found", 404);
      owner = file.owner;
      preventEditorSharing = file.preventEditorSharing;
    } else if (target.folderId) {
      const folder = await driveRepository.findFolderById(target.folderId);
      if (!folder) throw new AppError("Folder not found", 404);
      owner = folder.owner;
    }

    const permissions = await prisma.drivePermission.findMany({
      where: target.fileId
        ? { fileId: target.fileId }
        : { folderId: target.folderId },
      include: {
        user: true,
        grantedByUser: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const shareLink = await prisma.driveShareLink.findFirst({
      where: target.fileId
        ? { fileId: target.fileId }
        : { folderId: target.folderId },
    });

    const isOwner = perm.effectiveRole === "OWNER";
    const canManagePermissions =
      isOwner || (perm.effectiveRole === "EDITOR" && !preventEditorSharing);

    return {
      owner: {
        id: String(owner.id),
        fullName: owner.fullName,
        email: owner.email,
        username: owner.username,
      },
      permissions: permissions.map((p) => ({
        id: String(p.id),
        user: {
          id: String(p.user.id),
          fullName: p.user.fullName,
          email: p.user.email,
          username: p.user.username,
        },
        accessLevel: p.accessLevel,
        grantedBy: {
          id: String(p.grantedByUser.id),
          fullName: p.grantedByUser.fullName,
        },
        createdAt: p.createdAt,
      })),
      shareLink: shareLink
        ? {
            token: shareLink.token,
            role: shareLink.role,
            allowAnonymous: shareLink.allowAnonymous,
            expiresAt: shareLink.expiresAt,
            shareUrl: `/drive/s/${shareLink.token}`,
          }
        : null,
      canManagePermissions,
      effectiveRole: perm.effectiveRole,
    };
  }

  /**
   * Add collaborator with specified role.
   */
  async addPermission(
    userId: bigint,
    target: { fileId?: bigint; folderId?: bigint },
    dto: {
      email: string;
      accessLevel: "VIEWER" | "COMMENTER" | "EDITOR" | "MANAGER";
      notify?: boolean;
    },
  ) {
    const perm = await drivePermissionService.assertAccess(
      userId,
      target,
      "EDITOR",
    );

    if (target.fileId) {
      const file = await driveRepository.findFileById(target.fileId);
      if (file?.preventEditorSharing && perm.effectiveRole !== "OWNER") {
        throw new AppError("Only the file owner can modify sharing permissions", 403);
      }
      if (file?.owner.email === dto.email.trim()) {
        throw new AppError("User is already the owner of this file", 400);
      }
    } else if (target.folderId) {
      const folder = await driveRepository.findFolderById(target.folderId);
      if (folder?.owner.email === dto.email.trim()) {
        throw new AppError("User is already the owner of this folder", 400);
      }
    }

    const grantee = await prisma.user.findUnique({
      where: { email: dto.email.trim() },
    });
    if (!grantee) {
      throw new AppError("User with this email not found", 404);
    }

    const existing = await prisma.drivePermission.findFirst({
      where: {
        userId: grantee.id,
        ...(target.fileId ? { fileId: target.fileId } : { folderId: target.folderId }),
      },
    });

    let resultPerm: any;
    if (existing) {
      resultPerm = await prisma.drivePermission.update({
        where: { id: existing.id },
        data: {
          accessLevel: dto.accessLevel,
          grantedBy: userId,
        },
        include: { user: true },
      });
    } else {
      resultPerm = await prisma.drivePermission.create({
        data: {
          fileId: target.fileId,
          folderId: target.folderId,
          userId: grantee.id,
          accessLevel: dto.accessLevel,
          grantedBy: userId,
        },
        include: { user: true },
      });
    }

    await driveRepository.recordActivity({
      fileId: target.fileId,
      folderId: target.folderId,
      userId,
      action: "PERMISSION_ADDED",
      details: {
        granteeEmail: grantee.email,
        accessLevel: dto.accessLevel,
      },
    });

    if (dto.notify !== false) {
      try {
        const granter = await prisma.user.findUnique({
          where: { id: userId },
          select: { fullName: true, username: true, email: true },
        });
        const granterName = granter?.fullName || granter?.username || "Someone";
        const itemTitle = target.fileId
          ? (await driveRepository.findFileById(target.fileId))?.name || "a file"
          : (await driveRepository.findFolderById(target.folderId!))?.name || "a folder";

        await prisma.notification.create({
          data: {
            userId: grantee.id,
            actorId: userId,
            title: `${granterName} shared an item with you`,
            message: `${granterName} shared "${itemTitle}" with you (${dto.accessLevel.toLowerCase()}).`,
            type: "DRIVE" as any,
            referenceId: target.fileId || target.folderId,
            referenceType: target.fileId ? "DRIVE_FILE" : "DRIVE_FOLDER",
            actionUrl: target.fileId ? `/drive?preview=${target.fileId}` : `/drive/folders/${target.folderId}`,
          },
        });
      } catch (notifErr) {
        console.warn("Could not dispatch drive share notification:", notifErr);
      }
    }

    return {
      id: String(resultPerm.id),
      user: {
        id: String(resultPerm.user.id),
        fullName: resultPerm.user.fullName,
        email: resultPerm.user.email,
      },
      accessLevel: resultPerm.accessLevel,
    };
  }

  /**
   * Update collaborator access level.
   */
  async updatePermission(
    userId: bigint,
    permissionId: bigint,
    accessLevel: "VIEWER" | "COMMENTER" | "EDITOR" | "MANAGER",
  ) {
    const existing = await prisma.drivePermission.findUnique({
      where: { id: permissionId },
    });
    if (!existing) {
      throw new AppError("Permission not found", 404);
    }

    const target = {
      fileId: existing.fileId ?? undefined,
      folderId: existing.folderId ?? undefined,
    };
    const perm = await drivePermissionService.assertAccess(userId, target, "EDITOR");

    if (target.fileId) {
      const file = await driveRepository.findFileById(target.fileId);
      if (file?.preventEditorSharing && perm.effectiveRole !== "OWNER") {
        throw new AppError("Only the file owner can modify sharing permissions", 403);
      }
    }

    const updated = await prisma.drivePermission.update({
      where: { id: permissionId },
      data: { accessLevel, grantedBy: userId },
      include: { user: true },
    });

    await driveRepository.recordActivity({
      fileId: target.fileId,
      folderId: target.folderId,
      userId,
      action: "PERMISSION_UPDATED",
      details: {
        granteeId: String(existing.userId),
        newLevel: accessLevel,
      },
    });

    return {
      id: String(updated.id),
      user: {
        id: String(updated.user.id),
        fullName: updated.user.fullName,
        email: updated.user.email,
      },
      accessLevel: updated.accessLevel,
    };
  }

  /**
   * Remove collaborator permission.
   */
  async removePermission(userId: bigint, permissionId: bigint) {
    const existing = await prisma.drivePermission.findUnique({
      where: { id: permissionId },
    });
    if (!existing) {
      throw new AppError("Permission not found", 404);
    }

    const target = {
      fileId: existing.fileId ?? undefined,
      folderId: existing.folderId ?? undefined,
    };
    const perm = await drivePermissionService.assertAccess(userId, target, "EDITOR");

    if (target.fileId) {
      const file = await driveRepository.findFileById(target.fileId);
      if (file?.preventEditorSharing && perm.effectiveRole !== "OWNER") {
        throw new AppError("Only the file owner can modify sharing permissions", 403);
      }
    }

    await prisma.drivePermission.delete({
      where: { id: permissionId },
    });

    await driveRepository.recordActivity({
      fileId: target.fileId,
      folderId: target.folderId,
      userId,
      action: "PERMISSION_REMOVED",
      details: {
        granteeId: String(existing.userId),
      },
    });

    return { success: true, message: "Permission removed successfully" };
  }

  /**
   * Get or update General Link sharing settings.
   */
  async updateShareLink(
    userId: bigint,
    target: { fileId?: bigint; folderId?: bigint },
    dto: {
      role: "VIEWER" | "COMMENTER" | "EDITOR";
      allowAnonymous?: boolean;
      expiresAt?: Date | null;
      regenerateToken?: boolean;
      revoke?: boolean;
    },
  ) {
    const perm = await drivePermissionService.assertAccess(userId, target, "EDITOR");

    if (target.fileId) {
      const file = await driveRepository.findFileById(target.fileId);
      if (file?.preventEditorSharing && perm.effectiveRole !== "OWNER") {
        throw new AppError("Only the file owner can modify share link", 403);
      }
    }

    const existing = await prisma.driveShareLink.findFirst({
      where: target.fileId
        ? { fileId: target.fileId }
        : { folderId: target.folderId },
    });

    // Revoke link
    if (dto.revoke) {
      if (existing) {
        await prisma.driveShareLink.delete({ where: { id: existing.id } });
        await driveRepository.recordActivity({
          fileId: target.fileId,
          folderId: target.folderId,
          userId,
          action: "LINK_REVOKED",
        });
      }
      return { revoked: true, shareLink: null };
    }

    let token = existing?.token;
    if (!token || dto.regenerateToken) {
      token = crypto.randomBytes(32).toString("base64url");
    }

    let resultLink: any;
    if (existing) {
      resultLink = await prisma.driveShareLink.update({
        where: { id: existing.id },
        data: {
          token,
          role: dto.role,
          allowAnonymous: dto.allowAnonymous ?? existing.allowAnonymous,
          expiresAt: dto.expiresAt !== undefined ? dto.expiresAt : existing.expiresAt,
        },
      });
    } else {
      resultLink = await prisma.driveShareLink.create({
        data: {
          fileId: target.fileId,
          folderId: target.folderId,
          token,
          role: dto.role,
          allowAnonymous: dto.allowAnonymous ?? false,
          expiresAt: dto.expiresAt ?? null,
          createdBy: userId,
        },
      });
    }

    await driveRepository.recordActivity({
      fileId: target.fileId,
      folderId: target.folderId,
      userId,
      action: "LINK_UPDATED",
      details: { role: dto.role },
    });

    return {
      revoked: false,
      shareLink: {
        token: resultLink.token,
        role: resultLink.role,
        allowAnonymous: resultLink.allowAnonymous,
        expiresAt: resultLink.expiresAt,
        shareUrl: `/drive/s/${resultLink.token}`,
      },
    };
  }

  /**
   * Resolve a share link token for direct access or access request.
   */
  async resolveShareLink(userId: bigint, token: string) {
    const link = await prisma.driveShareLink.findUnique({
      where: { token },
      include: {
        file: {
          include: {
            owner: true,
            currentAsset: true,
          },
        },
        folder: {
          include: {
            owner: true,
          },
        },
      },
    });

    if (!link) {
      throw new AppError("Invalid or expired share link", 404);
    }

    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new AppError("This share link has expired", 410);
    }

    const isFile = !!link.fileId;
    const target = {
      fileId: link.fileId ?? undefined,
      folderId: link.folderId ?? undefined,
    };

    const item = isFile ? link.file : link.folder;
    if (!item || item.deletedAt) {
      throw new AppError("The shared item is no longer available", 404);
    }

    const perm = await drivePermissionService.getEffectivePermission(
      userId,
      target,
      token,
    );

    const hasAccess = perm.role !== "NONE";

    return {
      hasAccess,
      effectiveRole: perm.role,
      shareLink: {
        token: link.token,
        role: link.role,
        allowAnonymous: link.allowAnonymous,
        expiresAt: link.expiresAt,
      },
      item: {
        id: String(item.id),
        name: item.name,
        type: isFile ? ("file" as const) : ("folder" as const),
        owner: {
          id: String(item.owner.id),
          fullName: item.owner.fullName,
          email: item.owner.email,
        },
        ...(isFile && link.file
          ? {
              preventDownload: link.file.preventDownload,
              asset: {
                id: String(link.file.currentAsset.id),
                mimeType: link.file.currentAsset.mimeType,
                bytes: String(link.file.currentAsset.bytes),
              },
            }
          : {}),
      },
    };
  }

  /**
   * Request access to a restricted file or folder.
   */
  async createAccessRequest(
    userId: bigint,
    dto: {
      fileId?: bigint;
      folderId?: bigint;
      requestedRole: "VIEWER" | "COMMENTER" | "EDITOR";
      message?: string;
    },
  ) {
    let ownerId: bigint | null = null;
    let itemName = "";

    if (dto.fileId) {
      const file = await driveRepository.findFileById(dto.fileId);
      if (!file) throw new AppError("File not found", 404);
      ownerId = file.ownerId;
      itemName = file.name;
    } else if (dto.folderId) {
      const folder = await driveRepository.findFolderById(dto.folderId);
      if (!folder) throw new AppError("Folder not found", 404);
      ownerId = folder.ownerId;
      itemName = folder.name;
    } else {
      throw new AppError("fileId or folderId is required", 400);
    }

    if (ownerId === userId) {
      throw new AppError("You already own this item", 400);
    }

    const existingPending = await prisma.driveAccessRequest.findFirst({
      where: {
        requestedBy: userId,
        fileId: dto.fileId,
        folderId: dto.folderId,
        status: "PENDING",
      },
    });

    if (existingPending) {
      return {
        id: String(existingPending.id),
        status: existingPending.status,
        message: "Access request already pending",
      };
    }

    const req = await prisma.driveAccessRequest.create({
      data: {
        fileId: dto.fileId,
        folderId: dto.folderId,
        requestedBy: userId,
        requestedRole: dto.requestedRole,
        message: dto.message,
      },
      include: {
        requester: true,
      },
    });

    if (ownerId) {
      try {
        await prisma.notification.create({
          data: {
            userId: ownerId,
            actorId: userId,
            title: `Access requested for "${itemName}"`,
            message: `${req.requester.fullName || req.requester.username} requested ${dto.requestedRole.toLowerCase()} access: ${dto.message || "No message included"}`,
            type: "DRIVE" as any,
            referenceId: dto.fileId || dto.folderId,
            referenceType: "DRIVE_ACCESS_REQUEST",
            actionUrl: "/drive",
          },
        });
      } catch (notifErr) {
        console.warn("Could not dispatch access request notification:", notifErr);
      }
    }

    return {
      id: String(req.id),
      status: req.status,
      requestedRole: req.requestedRole,
      itemName,
      createdAt: req.createdAt,
    };
  }

  /**
   * List pending access requests for items owned by the current user.
   */
  async listAccessRequests(userId: bigint) {
    const ownedFiles = await prisma.driveFile.findMany({
      where: { ownerId: userId, deletedAt: null },
      select: { id: true },
    });
    const ownedFolders = await prisma.driveFolder.findMany({
      where: { ownerId: userId, deletedAt: null },
      select: { id: true },
    });

    const fileIds = ownedFiles.map((f) => f.id);
    const folderIds = ownedFolders.map((f) => f.id);

    const requests = await prisma.driveAccessRequest.findMany({
      where: {
        OR: [
          { fileId: { in: fileIds } },
          { folderId: { in: folderIds } },
        ],
        status: "PENDING",
      },
      include: {
        requester: true,
        file: true,
        folder: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return requests.map((r) => ({
      id: String(r.id),
      itemName: r.file?.name || r.folder?.name || "Item",
      type: r.fileId ? ("file" as const) : ("folder" as const),
      requestedRole: r.requestedRole,
      message: r.message,
      requester: {
        id: String(r.requester.id),
        fullName: r.requester.fullName,
        email: r.requester.email,
      },
      createdAt: r.createdAt,
    }));
  }

  /**
   * Approve or deny an access request.
   */
  async respondAccessRequest(
    userId: bigint,
    requestId: bigint,
    decision: "APPROVE" | "DENY",
    grantedRole?: "VIEWER" | "COMMENTER" | "EDITOR",
  ) {
    const req = await prisma.driveAccessRequest.findUnique({
      where: { id: requestId },
      include: { file: true, folder: true },
    });
    if (!req || req.status !== "PENDING") {
      throw new AppError("Access request not found or already processed", 404);
    }

    const ownerId = req.file?.ownerId || req.folder?.ownerId;
    if (ownerId !== userId) {
      throw new AppError("Only the item owner can respond to access requests", 403);
    }

    const newStatus = decision === "APPROVE" ? "APPROVED" : "DENIED";
    const finalRole = grantedRole || (req.requestedRole as any);

    await prisma.$transaction(async (tx) => {
      await tx.driveAccessRequest.update({
        where: { id: requestId },
        data: {
          status: newStatus,
          reviewedBy: userId,
          reviewedAt: new Date(),
        },
      });

      if (decision === "APPROVE") {
        if (req.fileId) {
          await tx.drivePermission.create({
            data: {
              fileId: req.fileId,
              userId: req.requestedBy,
              accessLevel: finalRole,
              grantedBy: userId,
            },
          });
        } else if (req.folderId) {
          await tx.drivePermission.create({
            data: {
              folderId: req.folderId,
              userId: req.requestedBy,
              accessLevel: finalRole,
              grantedBy: userId,
            },
          });
        }
      }
    });

    try {
      const itemTitle = req.file?.name || req.folder?.name || "the requested item";
      await prisma.notification.create({
        data: {
          userId: req.requestedBy,
          actorId: userId,
          title: `Access request ${newStatus.toLowerCase()}`,
          message: `Your request for "${itemTitle}" was ${newStatus.toLowerCase()}${decision === "APPROVE" ? ` with ${finalRole.toLowerCase()} role.` : "."}`,
          type: "DRIVE" as any,
          referenceId: req.fileId || req.folderId,
          referenceType: req.fileId ? "DRIVE_FILE" : "DRIVE_FOLDER",
          actionUrl: decision === "APPROVE" ? (req.fileId ? `/drive?preview=${req.fileId}` : `/drive/folders/${req.folderId}`) : "/drive",
        },
      });
    } catch (notifErr) {
      console.warn("Could not dispatch access response notification:", notifErr);
    }

    return {
      id: String(requestId),
      status: newStatus,
      grantedRole: decision === "APPROVE" ? finalRole : undefined,
    };
  }

  /**
   * List files and folders shared with the user.
   */
  async listSharedWithMe(userId: bigint, options?: { limit?: number; offset?: number }) {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const permissions = await prisma.drivePermission.findMany({
      where: {
        userId,
        file: { deletedAt: null },
      },
      include: {
        file: {
          include: {
            currentAsset: true,
            owner: true,
          },
        },
        grantedByUser: true,
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
    });

    const folderPermissions = await prisma.drivePermission.findMany({
      where: {
        userId,
        folder: { deletedAt: null },
      },
      include: {
        folder: {
          include: {
            owner: true,
          },
        },
        grantedByUser: true,
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
    });

    const files = permissions
      .filter((p) => p.file !== null)
      .map((p) => ({
        id: String(p.file!.id),
        type: "file" as const,
        name: p.file!.name,
        description: p.file!.description,
        currentVersion: p.file!.currentVersion,
        preventDownload: p.file!.preventDownload,
        preventEditorSharing: p.file!.preventEditorSharing,
        owner: p.file!.owner,
        asset: {
          id: String(p.file!.currentAsset.id),
          mimeType: p.file!.currentAsset.mimeType,
          bytes: String(p.file!.currentAsset.bytes),
          format: p.file!.currentAsset.format,
          resourceType: p.file!.currentAsset.resourceType,
          createdAt: p.file!.currentAsset.createdAt,
        },
        effectiveRole: p.accessLevel,
        sharedBy: {
          id: String(p.grantedByUser.id),
          fullName: p.grantedByUser.fullName,
          email: p.grantedByUser.email,
        },
        sharedAt: p.createdAt,
        createdAt: p.file!.createdAt,
        updatedAt: p.file!.updatedAt,
      }));

    const folders = folderPermissions
      .filter((p) => p.folder !== null)
      .map((p) => ({
        id: String(p.folder!.id),
        type: "folder" as const,
        name: p.folder!.name,
        color: p.folder!.color,
        description: p.folder!.description,
        owner: p.folder!.owner,
        effectiveRole: p.accessLevel,
        sharedBy: {
          id: String(p.grantedByUser.id),
          fullName: p.grantedByUser.fullName,
          email: p.grantedByUser.email,
        },
        sharedAt: p.createdAt,
        createdAt: p.folder!.createdAt,
        updatedAt: p.folder!.updatedAt,
      }));

    return {
      files,
      folders,
      totalCount: files.length + folders.length,
    };
  }

  /**
   * Create a shortcut to a file or folder in My Drive.
   */
  async createShortcut(
    userId: bigint,
    dto: {
      targetType: "file" | "folder";
      targetId: bigint;
      parentFolderId?: bigint | null;
    },
  ) {
    let name = "Shortcut";

    if (dto.targetType === "file") {
      const file = await driveRepository.findFileById(dto.targetId);
      if (!file) throw new AppError("Target file not found", 404);
      name = file.name;
    } else {
      const folder = await driveRepository.findFolderById(dto.targetId);
      if (!folder) throw new AppError("Target folder not found", 404);
      name = folder.name;
    }

    const shortcut = await prisma.driveShortcut.create({
      data: {
        userId,
        targetFileId: dto.targetType === "file" ? dto.targetId : null,
        targetFolderId: dto.targetType === "folder" ? dto.targetId : null,
        parentFolderId: dto.parentFolderId ?? null,
        name,
      },
    });

    return {
      id: String(shortcut.id),
      name: shortcut.name,
      targetType: dto.targetType,
      targetId: String(dto.targetId),
      createdAt: shortcut.createdAt,
    };
  }

  /**
   * Delete a shortcut.
   */
  async deleteShortcut(userId: bigint, shortcutId: bigint) {
    const shortcut = await prisma.driveShortcut.findUnique({
      where: { id: shortcutId },
    });
    if (!shortcut || shortcut.userId !== userId) {
      throw new AppError("Shortcut not found", 404);
    }

    await prisma.driveShortcut.delete({ where: { id: shortcutId } });
    return { success: true, message: "Shortcut deleted" };
  }

  /**
   * Empty all items in the user's Trash permanently.
   */
  async emptyTrash(userId: bigint) {
    const trashedFiles = await prisma.driveFile.findMany({
      where: { ownerId: userId, deletedAt: { not: null } },
      include: {
        currentAsset: true,
        versions: { include: { asset: true } },
      },
    });

    const trashedFolders = await prisma.driveFolder.findMany({
      where: { ownerId: userId, deletedAt: { not: null } },
    });

    // 1. Delete database records in transaction
    await prisma.$transaction(async (tx) => {
      const fileIds = trashedFiles.map((f) => f.id);
      const folderIds = trashedFolders.map((f) => f.id);

      if (fileIds.length > 0) {
        await tx.driveFileVersion.deleteMany({ where: { fileId: { in: fileIds } } });
        await tx.drivePermission.deleteMany({ where: { fileId: { in: fileIds } } });
        await tx.driveActivity.deleteMany({ where: { fileId: { in: fileIds } } });
        await tx.driveShortcut.deleteMany({ where: { targetFileId: { in: fileIds } } });
        await tx.driveFile.deleteMany({ where: { id: { in: fileIds } } });
      }

      if (folderIds.length > 0) {
        await tx.drivePermission.deleteMany({ where: { folderId: { in: folderIds } } });
        await tx.driveActivity.deleteMany({ where: { folderId: { in: folderIds } } });
        await tx.driveShortcut.deleteMany({ where: { targetFolderId: { in: folderIds } } });
        await tx.driveFolder.deleteMany({ where: { id: { in: folderIds } } });
      }
    });

    // 2. Clean up storage blobs
    for (const file of trashedFiles) {
      if (file.currentAsset) {
        await deleteAssetBlob(file.currentAsset).catch(() => {});
      }
      for (const v of file.versions) {
        if (v.asset) {
          await deleteAssetBlob(v.asset).catch(() => {});
        }
      }
    }

    return {
      success: true,
      count: trashedFiles.length + trashedFolders.length,
      message: `Permanently deleted ${trashedFiles.length} file(s) and ${trashedFolders.length} folder(s)`,
    };
  }

  /**
   * Auto-purge items in Trash older than retentionDays (defaults to 30).
   */
  async purgeExpiredTrash(retentionDays = 30) {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    const expiredFiles = await prisma.driveFile.findMany({
      where: { deletedAt: { lte: cutoffDate } },
      include: {
        currentAsset: true,
        versions: { include: { asset: true } },
      },
    });

    const expiredFolders = await prisma.driveFolder.findMany({
      where: { deletedAt: { lte: cutoffDate } },
    });

    if (expiredFiles.length === 0 && expiredFolders.length === 0) {
      return { purgedFiles: 0, purgedFolders: 0 };
    }

    await prisma.$transaction(async (tx) => {
      const fileIds = expiredFiles.map((f) => f.id);
      const folderIds = expiredFolders.map((f) => f.id);

      if (fileIds.length > 0) {
        await tx.driveFileVersion.deleteMany({ where: { fileId: { in: fileIds } } });
        await tx.drivePermission.deleteMany({ where: { fileId: { in: fileIds } } });
        await tx.driveActivity.deleteMany({ where: { fileId: { in: fileIds } } });
        await tx.driveShortcut.deleteMany({ where: { targetFileId: { in: fileIds } } });
        await tx.driveFile.deleteMany({ where: { id: { in: fileIds } } });
      }

      if (folderIds.length > 0) {
        await tx.drivePermission.deleteMany({ where: { folderId: { in: folderIds } } });
        await tx.driveActivity.deleteMany({ where: { folderId: { in: folderIds } } });
        await tx.driveShortcut.deleteMany({ where: { targetFolderId: { in: folderIds } } });
        await tx.driveFolder.deleteMany({ where: { id: { in: folderIds } } });
      }
    });

    // Delete blobs
    for (const f of expiredFiles) {
      if (f.currentAsset) {
        await deleteAssetBlob(f.currentAsset).catch(() => {});
      }
      for (const v of f.versions) {
        if (v.asset) {
          await deleteAssetBlob(v.asset).catch(() => {});
        }
      }
    }

    return {
      purgedFiles: expiredFiles.length,
      purgedFolders: expiredFolders.length,
    };
  }

  /**
   * Upload a new version of an existing file.
   */
  async uploadNewVersion(
    userId: bigint,
    fileId: bigint,
    fileData: {
      buffer: Buffer;
      originalname: string;
      mimetype?: string;
      size: number;
    },
  ) {
    const file = await driveRepository.findFileById(fileId);
    if (!file || file.deletedAt) {
      throw new AppError("File not found or has been trashed", 404);
    }

    await drivePermissionService.assertAccess(userId, { fileId }, "EDITOR");

    // Check user quota for new version bytes
    const newBytes = BigInt(fileData.size || fileData.buffer.length);
    const { usedBytes } = await driveRepository.getUserStorageUsage(file.ownerId);
    if (usedBytes + newBytes > getTotalQuota()) {
      throw new AppError("Storage quota exceeded. Cannot upload new version.", 400);
    }

    const detectedMime =
      mime.lookup(fileData.originalname) || fileData.mimetype || "application/octet-stream";
    const resourceType = inferResourceType(detectedMime);
    const ext = path.extname(fileData.originalname).replace(/^\./, "");

    const storage = getStorageProvider();
    const safeStorageName = sanitizeStorageFilename(fileData.originalname);
    const storageKey = `drive/${userId}/${Date.now()}_${crypto.randomUUID()}_${safeStorageName}`;
    const stored = await storage.putBuffer(storageKey, fileData.buffer, {
      mimeType: detectedMime,
      filename: fileData.originalname,
    });

    // Extract text content if text-based
    let searchableContent: string | null = null;
    if (
      detectedMime.startsWith("text/") ||
      detectedMime === "application/json" ||
      detectedMime === "application/javascript" ||
      detectedMime === "application/xml"
    ) {
      searchableContent = fileData.buffer.toString(
        "utf-8",
        0,
        Math.min(fileData.buffer.length, 100 * 1024),
      );
    }

    const newAsset = await prisma.fileAsset.create({
      data: buildFileAssetData(userId, stored, {
        originalFilename: fileData.originalname,
        mimeType: detectedMime,
        fallbackStorageKey: storageKey,
        fallbackResourceType: resourceType,
        fallbackFormat: ext || null,
      }),
    });

    const newVersionNumber = file.currentVersion + 1;
    const MAX_VERSIONS = Number(process.env.MAX_FILE_VERSIONS) || 20;

    await prisma.$transaction(async (tx) => {
      // 1. Archive current asset as a previous version
      await tx.driveFileVersion.create({
        data: {
          fileId,
          versionNumber: file.currentVersion,
          assetId: file.assetId,
          uploadedBy: file.ownerId,
        },
      });

      // 2. Update DriveFile to point to new asset
      await tx.driveFile.update({
        where: { id: fileId },
        data: {
          assetId: newAsset.id,
          currentVersion: newVersionNumber,
          searchableContent: searchableContent ?? file.searchableContent,
          updatedAt: new Date(),
        },
      });

      // 3. Enforce version retention limit
      const versions = await tx.driveFileVersion.findMany({
        where: { fileId },
        orderBy: { versionNumber: "asc" },
        include: { asset: true },
      });

      if (versions.length > MAX_VERSIONS) {
        const toDelete = versions.slice(0, versions.length - MAX_VERSIONS);
        for (const v of toDelete) {
          await tx.driveFileVersion.delete({ where: { id: v.id } });
          if (v.asset) {
            await deleteAssetBlob(v.asset).catch(() => {});
          }
        }
      }
    });

    await driveRepository.recordActivity({
      fileId,
      userId,
      action: "NEW_VERSION_UPLOADED",
      details: {
        versionNumber: newVersionNumber,
        filename: fileData.originalname,
        bytes: String(stored.size),
      },
    });

    return {
      fileId: String(fileId),
      versionNumber: newVersionNumber,
      asset: {
        id: String(newAsset.id),
        mimeType: newAsset.mimeType,
        bytes: String(newAsset.bytes),
      },
      updatedAt: new Date(),
    };
  }

  /**
   * List all versions of a file (current + historical).
   */
  async listFileVersions(userId: bigint, fileId: bigint) {
    const file = await driveRepository.findFileById(fileId);
    if (!file || file.deletedAt) {
      throw new AppError("File not found", 404);
    }

    await drivePermissionService.assertAccess(userId, { fileId }, "VIEWER");

    const historical = await prisma.driveFileVersion.findMany({
      where: { fileId },
      include: {
        asset: true,
        uploader: true,
      },
      orderBy: { versionNumber: "desc" },
    });

    const versions = [
      // Current active version
      {
        id: "current",
        versionNumber: file.currentVersion,
        isCurrent: true,
        asset: {
          id: String(file.currentAsset.id),
          mimeType: file.currentAsset.mimeType,
          bytes: String(file.currentAsset.bytes),
          format: file.currentAsset.format,
          createdAt: file.currentAsset.createdAt,
        },
        uploader: {
          id: String(file.owner.id),
          fullName: file.owner.fullName,
          email: file.owner.email,
        },
        createdAt: file.updatedAt,
      },
      // Historical versions
      ...historical.map((v) => ({
        id: String(v.id),
        versionNumber: v.versionNumber,
        isCurrent: false,
        asset: {
          id: String(v.asset.id),
          mimeType: v.asset.mimeType,
          bytes: String(v.asset.bytes),
          format: v.asset.format,
          createdAt: v.asset.createdAt,
        },
        uploader: {
          id: String(v.uploader.id),
          fullName: v.uploader.fullName,
          email: v.uploader.email,
        },
        createdAt: v.createdAt,
      })),
    ];

    return {
      fileId: String(fileId),
      fileName: file.name,
      currentVersion: file.currentVersion,
      versions,
    };
  }

  /**
   * Get download stream for a specific file version.
   */
  async getFileVersionDownloadStream(
    userId: bigint,
    fileId: bigint,
    versionId: bigint,
    linkToken?: string,
  ) {
    const file = await driveRepository.findFileById(fileId);
    if (!file || file.deletedAt) throw new AppError("File not found", 404);

    const perm = await drivePermissionService.assertAccess(
      userId,
      { fileId },
      "VIEWER",
      linkToken,
    );

    if (
      file.preventDownload &&
      (perm.effectiveRole === "VIEWER" || perm.effectiveRole === "COMMENTER")
    ) {
      throw new AppError("Download disabled by the file owner", 403);
    }

    const version = await prisma.driveFileVersion.findUnique({
      where: { id: versionId },
      include: { asset: true },
    });
    if (!version || version.fileId !== fileId) {
      throw new AppError("File version not found", 404);
    }

    const { stream, totalLength, mimeType } = await resolveAssetStream(version.asset);

    return {
      stream,
      filename: `${path.parse(file.name).name}_v${version.versionNumber}${path.extname(file.name)}`,
      mimeType: mimeType || version.asset.mimeType,
      size: totalLength || Number(version.asset.bytes),
    };
  }

  /**
   * Restore a historical version to be the current active asset.
   */
  async restoreFileVersion(userId: bigint, fileId: bigint, versionId: bigint) {
    const file = await driveRepository.findFileById(fileId);
    if (!file || file.deletedAt) {
      throw new AppError("File not found", 404);
    }

    await drivePermissionService.assertAccess(userId, { fileId }, "EDITOR");

    const targetVersion = await prisma.driveFileVersion.findUnique({
      where: { id: versionId },
      include: { asset: true },
    });
    if (!targetVersion || targetVersion.fileId !== fileId) {
      throw new AppError("Version not found", 404);
    }

    const newVersionNumber = file.currentVersion + 1;

    await prisma.$transaction(async (tx) => {
      // 1. Archive current active asset
      await tx.driveFileVersion.create({
        data: {
          fileId,
          versionNumber: file.currentVersion,
          assetId: file.assetId,
          uploadedBy: userId,
        },
      });

      // 2. Set target version's asset as current
      await tx.driveFile.update({
        where: { id: fileId },
        data: {
          assetId: targetVersion.assetId,
          currentVersion: newVersionNumber,
          updatedAt: new Date(),
        },
      });
    });

    await driveRepository.recordActivity({
      fileId,
      userId,
      action: "VERSION_RESTORED",
      details: {
        restoredFromVersion: targetVersion.versionNumber,
        newVersionNumber,
      },
    });

    return {
      success: true,
      message: `Version ${targetVersion.versionNumber} restored as version ${newVersionNumber}`,
      currentVersion: newVersionNumber,
    };
  }

  /**
   * Delete an older historical version.
   */
  async deleteFileVersion(userId: bigint, fileId: bigint, versionId: bigint) {
    const file = await driveRepository.findFileById(fileId);
    if (!file || file.deletedAt) {
      throw new AppError("File not found", 404);
    }

    const perm = await drivePermissionService.assertAccess(userId, { fileId }, "EDITOR");
    if (perm.effectiveRole !== "OWNER") {
      throw new AppError("Only the file owner can delete file versions", 403);
    }

    const targetVersion = await prisma.driveFileVersion.findUnique({
      where: { id: versionId },
      include: { asset: true },
    });
    if (!targetVersion || targetVersion.fileId !== fileId) {
      throw new AppError("Version not found", 404);
    }

    await prisma.driveFileVersion.delete({ where: { id: versionId } });

    // Clean up blob if not referenced by another record
    if (targetVersion.asset) {
      const isReferenced = await prisma.driveFile.findFirst({
        where: { assetId: targetVersion.assetId },
      });
      if (!isReferenced) {
        await deleteAssetBlob(targetVersion.asset).catch(() => {});
      }
    }

    await driveRepository.recordActivity({
      fileId,
      userId,
      action: "VERSION_DELETED",
      details: { deletedVersionNumber: targetVersion.versionNumber },
    });

    return { success: true, message: "Version deleted successfully" };
  }

  /**
   * Full-text search and indexed multi-filter query.
   */
  async searchItems(
    userId: bigint,
    filters: {
      q?: string;
      type?: string;
      owner?: string;
      modified?: string;
      sortBy?: string;
      sortOrder?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    const query = filters.q?.trim() || "";

    // 1. Compute modified date filter
    let modifiedAfter: Date | undefined;
    const now = new Date();
    if (filters.modified === "today") {
      modifiedAfter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (filters.modified === "last7days") {
      modifiedAfter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (filters.modified === "last30days") {
      modifiedAfter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    } else if (filters.modified === "thisYear") {
      modifiedAfter = new Date(now.getFullYear(), 0, 1);
    }

    // 2. Build where clause for files
    const fileWhere: Prisma.DriveFileWhereInput = {
      deletedAt: null,
      OR: [
        { ownerId: userId },
        { permissions: { some: { userId } } },
      ],
    };

    if (filters.owner === "me") {
      fileWhere.ownerId = userId;
      delete fileWhere.OR;
    } else if (filters.owner === "not_me") {
      fileWhere.ownerId = { not: userId };
      fileWhere.permissions = { some: { userId } };
      delete fileWhere.OR;
    }

    if (modifiedAfter) {
      fileWhere.updatedAt = { gte: modifiedAfter };
    }

    if (query) {
      fileWhere.AND = [
        {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { searchableContent: { contains: query, mode: "insensitive" } },
          ],
        },
      ];
    }

    // Type filter
    if (filters.type && filters.type !== "folder") {
      const mimeFilters: Record<string, Prisma.FileAssetWhereInput> = {
        image: { mimeType: { startsWith: "image/" } },
        video: { mimeType: { startsWith: "video/" } },
        audio: { mimeType: { startsWith: "audio/" } },
        pdf: { mimeType: "application/pdf" },
        document: {
          mimeType: {
            in: [
              "application/pdf",
              "application/msword",
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              "text/plain",
              "text/markdown",
            ],
          },
        },
        spreadsheet: {
          mimeType: {
            in: [
              "text/csv",
              "application/vnd.ms-excel",
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ],
          },
        },
        presentation: {
          mimeType: {
            in: [
              "application/vnd.ms-powerpoint",
              "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            ],
          },
        },
      };

      if (mimeFilters[filters.type]) {
        fileWhere.currentAsset = mimeFilters[filters.type];
      }
    }

    const includeFolders = !filters.type || filters.type === "folder";
    let folders: any[] = [];

    if (includeFolders) {
      const folderWhere: Prisma.DriveFolderWhereInput = {
        deletedAt: null,
        OR: [
          { ownerId: userId },
          { permissions: { some: { userId } } },
        ],
      };

      if (filters.owner === "me") {
        folderWhere.ownerId = userId;
        delete folderWhere.OR;
      } else if (filters.owner === "not_me") {
        folderWhere.ownerId = { not: userId };
        folderWhere.permissions = { some: { userId } };
        delete folderWhere.OR;
      }

      if (modifiedAfter) {
        folderWhere.updatedAt = { gte: modifiedAfter };
      }

      if (query) {
        folderWhere.name = { contains: query, mode: "insensitive" };
      }

      folders = await prisma.driveFolder.findMany({
        where: folderWhere,
        include: { owner: true },
        take: limit,
        skip: offset,
        orderBy: { [filters.sortBy === "name" ? "name" : "updatedAt"]: filters.sortOrder || "desc" },
      });
    }

    const files =
      filters.type === "folder"
        ? []
        : await prisma.driveFile.findMany({
            where: fileWhere,
            include: { owner: true, currentAsset: true },
            take: limit,
            skip: offset,
            orderBy: {
              [filters.sortBy === "name"
                ? "name"
                : filters.sortBy === "size"
                ? "assetId"
                : "updatedAt"]: filters.sortOrder || "desc",
            },
          });

    return {
      files: files.map((f) => ({
        id: String(f.id),
        type: "file" as const,
        name: f.name,
        description: f.description,
        currentVersion: f.currentVersion,
        preventDownload: f.preventDownload,
        preventEditorSharing: f.preventEditorSharing,
        owner: {
          id: String(f.owner.id),
          fullName: f.owner.fullName,
          email: f.owner.email,
        },
        asset: {
          id: String(f.currentAsset.id),
          mimeType: f.currentAsset.mimeType,
          bytes: String(f.currentAsset.bytes),
          format: f.currentAsset.format,
          resourceType: f.currentAsset.resourceType,
          createdAt: f.currentAsset.createdAt,
        },
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      })),
      folders: folders.map((fd) => ({
        id: String(fd.id),
        type: "folder" as const,
        name: fd.name,
        color: fd.color,
        description: fd.description,
        owner: {
          id: String(fd.owner.id),
          fullName: fd.owner.fullName,
          email: fd.owner.email,
        },
        createdAt: fd.createdAt,
        updatedAt: fd.updatedAt,
      })),
      totalResults: files.length + folders.length,
    };
  }

  /**
   * List activity timeline for a specific item or recent user drive events.
   */
  async listActivities(
    userId: bigint,
    query: { fileId?: bigint; folderId?: bigint; limit?: number; offset?: number },
  ) {
    const limit = query.limit || 50;
    const offset = query.offset || 0;

    let where: Prisma.DriveActivityWhereInput = {};

    if (query.fileId) {
      await drivePermissionService.assertAccess(userId, { fileId: query.fileId }, "VIEWER");
      where.fileId = query.fileId;
    } else if (query.folderId) {
      await drivePermissionService.assertAccess(userId, { folderId: query.folderId }, "VIEWER");
      where.folderId = query.folderId;
    } else {
      // User's accessible items activities
      const accessibleFiles = await prisma.driveFile.findMany({
        where: {
          OR: [{ ownerId: userId }, { permissions: { some: { userId } } }],
        },
        select: { id: true },
      });
      const accessibleFolders = await prisma.driveFolder.findMany({
        where: {
          OR: [{ ownerId: userId }, { permissions: { some: { userId } } }],
        },
        select: { id: true },
      });

      where = {
        OR: [
          { userId },
          { fileId: { in: accessibleFiles.map((f) => f.id) } },
          { folderId: { in: accessibleFolders.map((fd) => fd.id) } },
        ],
      };
    }

    const activities = await prisma.driveActivity.findMany({
      where,
      include: {
        user: true,
        file: true,
        folder: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    return activities.map((a) => ({
      id: String(a.id),
      action: a.action,
      details: a.details,
      user: {
        id: String(a.user.id),
        fullName: a.user.fullName,
        email: a.user.email,
      },
      item: a.file
        ? { id: String(a.file.id), name: a.file.name, type: "file" as const }
        : a.folder
        ? { id: String(a.folder.id), name: a.folder.name, type: "folder" as const }
        : undefined,
      createdAt: a.createdAt,
    }));
  }

  /**
   * List files accessed/updated recently by the user.
   */
  async listRecent(userId: bigint, limit = 50) {
    // 1. Query recent items table
    const recentRecords = await prisma.driveRecentItem.findMany({
      where: { userId, file: { deletedAt: null } },
      include: {
        file: {
          include: {
            currentAsset: true,
            owner: true,
          },
        },
      },
      orderBy: { accessedAt: "desc" },
      take: limit,
    });

    if (recentRecords.length > 0) {
      return recentRecords
        .filter((r) => r.file !== null)
        .map((r) => ({
          id: String(r.file!.id),
          type: "file" as const,
          name: r.file!.name,
          description: r.file!.description,
          currentVersion: r.file!.currentVersion,
          preventDownload: r.file!.preventDownload,
          preventEditorSharing: r.file!.preventEditorSharing,
          owner: {
            id: String(r.file!.owner.id),
            fullName: r.file!.owner.fullName,
            email: r.file!.owner.email,
          },
          asset: {
            id: String(r.file!.currentAsset.id),
            mimeType: r.file!.currentAsset.mimeType,
            bytes: String(r.file!.currentAsset.bytes),
            format: r.file!.currentAsset.format,
            createdAt: r.file!.currentAsset.createdAt,
          },
          lastAccessedAt: r.accessedAt,
          createdAt: r.file!.createdAt,
          updatedAt: r.file!.updatedAt,
        }));
    }

    // Fallback: user's accessible files sorted by updatedAt desc
    const files = await prisma.driveFile.findMany({
      where: {
        deletedAt: null,
        OR: [{ ownerId: userId }, { permissions: { some: { userId } } }],
      },
      include: { currentAsset: true, owner: true },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });

    return files.map((f) => ({
      id: String(f.id),
      type: "file" as const,
      name: f.name,
      description: f.description,
      currentVersion: f.currentVersion,
      preventDownload: f.preventDownload,
      preventEditorSharing: f.preventEditorSharing,
      owner: {
        id: String(f.owner.id),
        fullName: f.owner.fullName,
        email: f.owner.email,
      },
      asset: {
        id: String(f.currentAsset.id),
        mimeType: f.currentAsset.mimeType,
        bytes: String(f.currentAsset.bytes),
        format: f.currentAsset.format,
        createdAt: f.currentAsset.createdAt,
      },
      lastAccessedAt: f.updatedAt,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    }));
  }

  /**
   * Record access event for recent tracking.
   */
  async recordRecentAccess(userId: bigint, target: { fileId?: bigint; folderId?: bigint }) {
    if (target.fileId) {
      const existing = await prisma.driveRecentItem.findFirst({
        where: { userId, fileId: target.fileId },
      });
      if (existing) {
        await prisma.driveRecentItem.update({
          where: { id: existing.id },
          data: { accessedAt: new Date() },
        });
      } else {
        await prisma.driveRecentItem.create({
          data: { userId, fileId: target.fileId, accessedAt: new Date() },
        });
      }
    }
  }

  /**
   * List items starred/favorited by the user.
   */
  async listStarred(userId: bigint) {
    const favorites = await prisma.driveFavorite.findMany({
      where: { userId },
      include: {
        file: {
          include: {
            owner: { select: { id: true, fullName: true, username: true, email: true } },
            currentAsset: true,
          },
        },
        folder: {
          include: {
            owner: { select: { id: true, fullName: true, username: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const activeFavorites = favorites.filter(
      (fav) =>
        (fav.file && !fav.file.deletedAt) || (fav.folder && !fav.folder.deletedAt),
    );

    const files = activeFavorites
      .filter((fav) => fav.file && !fav.file.deletedAt)
      .map((fav) => ({
        id: String(fav.file!.id),
        name: fav.file!.name,
        description: fav.file!.description,
        currentVersion: fav.file!.currentVersion,
        preventDownload: fav.file!.preventDownload,
        preventEditorSharing: fav.file!.preventEditorSharing,
        owner: fav.file!.owner,
        deletedAt: fav.file!.deletedAt,
        isStarred: true,
        asset: {
          id: String(fav.file!.currentAsset.id),
          mimeType: fav.file!.currentAsset.mimeType,
          bytes: String(fav.file!.currentAsset.bytes),
          format: fav.file!.currentAsset.format,
          resourceType: fav.file!.currentAsset.resourceType,
          secureUrl: fav.file!.currentAsset.secureUrl,
        },
        createdAt: fav.file!.createdAt,
        updatedAt: fav.file!.updatedAt,
        type: "file" as const,
      }));

    const folders = activeFavorites
      .filter((fav) => fav.folder && !fav.folder.deletedAt)
      .map((fav) => ({
        id: String(fav.folder!.id),
        name: fav.folder!.name,
        color: fav.folder!.color,
        description: fav.folder!.description,
        owner: fav.folder!.owner,
        deletedAt: fav.folder!.deletedAt,
        isStarred: true,
        createdAt: fav.folder!.createdAt,
        updatedAt: fav.folder!.updatedAt,
        type: "folder" as const,
      }));

    return { files, folders };
  }

  /**
   * Save an existing FileAsset (from Mail or Chat) into the user's Drive.
   */
  async saveAssetToDrive(
    userId: bigint,
    dto: {
      assetId: string;
      filename?: string;
      folderId?: string | null;
    },
  ) {
    const assetId = BigInt(dto.assetId);
    const asset = await prisma.fileAsset.findUnique({
      where: { id: assetId },
    });
    if (!asset) {
      throw new AppError("Asset not found", 404);
    }

    const targetFolderId =
      dto.folderId && dto.folderId !== "root" ? BigInt(dto.folderId) : null;

    if (targetFolderId) {
      await drivePermissionService.assertAccess(
        userId,
        { folderId: targetFolderId },
        "EDITOR",
      );
    }

    const fileName = dto.filename || asset.originalFilename || `File_${Date.now()}`;
    const uniqueName = await driveRepository.resolveUniqueFileName(
      targetFolderId,
      userId,
      fileName,
    );

    const file = await prisma.driveFile.create({
      data: {
        name: uniqueName,
        ownerId: userId,
        folderId: targetFolderId,
        assetId: asset.id,
        currentVersion: 1,
        searchableContent: asset.originalFilename,
      },
      include: {
        currentAsset: true,
        owner: { select: { id: true, fullName: true, username: true, email: true } },
      },
    });

    await driveRepository.recordActivity({
      fileId: file.id,
      userId,
      action: "UPLOADED",
      details: { source: "SAVED_TO_DRIVE", originalFilename: asset.originalFilename },
    });

    return {
      id: String(file.id),
      name: file.name,
      folderId: file.folderId ? String(file.folderId) : null,
      asset: {
        id: String(file.currentAsset.id),
        mimeType: file.currentAsset.mimeType,
        bytes: String(file.currentAsset.bytes),
        format: file.currentAsset.format,
      },
      owner: file.owner,
      createdAt: file.createdAt,
      type: "file" as const,
    };
  }

  /**
   * Service hook to store a completed Meet recording directly into Drive.
   */
  async storeMeetingRecordingInDrive(
    userId: bigint,
    dto: {
      meetingId: string;
      title: string;
      assetId: string;
    },
  ) {
    // 1. Ensure or create a "Meet Recordings" system folder for the user
    let recordingsFolder = await prisma.driveFolder.findFirst({
      where: {
        ownerId: userId,
        name: "Meet Recordings",
        parentFolderId: null,
        deletedAt: null,
      },
    });

    if (!recordingsFolder) {
      recordingsFolder = await prisma.driveFolder.create({
        data: {
          name: "Meet Recordings",
          ownerId: userId,
          color: "#ea4335", // Red folder for recordings
          description: "Recordings from Orvexa Meet conferences",
        },
      });
    }

    return this.saveAssetToDrive(userId, {
      assetId: dto.assetId,
      filename: `${dto.title || "Meeting"}_${new Date().toISOString().slice(0, 10)}.mp4`,
      folderId: String(recordingsFolder.id),
    });
  }

  /**
   * Helper for Mail and Chat to batch-ensure recipients have access to shared Drive files.
   */
  async batchEnsureRecipientsAccess(
    ownerId: bigint,
    dto: {
      fileIds: string[];
      recipientEmails: string[];
      role?: "VIEWER" | "COMMENTER" | "EDITOR";
    },
  ) {
    const role = dto.role || "VIEWER";
    const results: Array<{ fileId: string; email: string; granted: boolean }> = [];

    for (const fId of dto.fileIds) {
      const fileId = BigInt(fId);
      const file = await driveRepository.findFileById(fileId);
      if (!file) continue;

      for (const email of dto.recipientEmails) {
        const cleanEmail = email.trim().toLowerCase();
        if (cleanEmail === file.owner.email.toLowerCase()) continue;

        const targetUser = await prisma.user.findUnique({
          where: { email: cleanEmail },
        });
        if (!targetUser) continue;

        const effective = await drivePermissionService.getEffectivePermission(targetUser.id, {
          fileId,
        });

        if (!effective || effective.role === "NONE") {
          await this.addPermission(
            ownerId,
            { fileId },
            { email: cleanEmail, accessLevel: role, notify: true },
          );
          results.push({ fileId: fId, email: cleanEmail, granted: true });
        } else {
          results.push({ fileId: fId, email: cleanEmail, granted: false });
        }
      }
    }

    return results;
  }
}

export const driveService = new DriveService();
export default driveService;
