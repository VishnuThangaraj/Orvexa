import prisma from "../../infrastructure/database/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";

export interface PaginationOptions {
  limit: number;
  offset: number;
  sortBy: "name" | "updatedAt" | "size" | "createdAt";
  sortOrder: "asc" | "desc";
}

export class DriveRepository {
  async findFolderById(id: bigint) {
    return prisma.driveFolder.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, fullName: true, username: true, email: true },
        },
      },
    });
  }

  async findFileById(id: bigint) {
    return prisma.driveFile.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, fullName: true, username: true, email: true },
        },
        currentAsset: true,
      },
    });
  }

  async findSubfolders(
    ownerId: bigint,
    parentFolderId: bigint | null,
    options: PaginationOptions,
    isTrashed: boolean = false,
  ) {
    return prisma.driveFolder.findMany({
      where: {
        ownerId,
        ...(isTrashed ? {} : { parentFolderId }),
        deletedAt: isTrashed ? { not: null } : null,
      },
      orderBy: {
        [options.sortBy === "size" ? "name" : options.sortBy]: options.sortOrder,
      },
      take: options.limit,
      skip: options.offset,
      include: {
        owner: {
          select: { id: true, fullName: true, username: true, email: true },
        },
      },
    });
  }

  async findFiles(
    ownerId: bigint,
    folderId: bigint | null,
    options: PaginationOptions,
    isTrashed: boolean = false,
  ) {
    return prisma.driveFile.findMany({
      where: {
        ownerId,
        ...(isTrashed ? {} : { folderId }),
        deletedAt: isTrashed ? { not: null } : null,
      },
      orderBy:
        options.sortBy === "size"
          ? { currentAsset: { bytes: options.sortOrder } }
          : { [options.sortBy]: options.sortOrder },
      take: options.limit,
      skip: options.offset,
      include: {
        owner: {
          select: { id: true, fullName: true, username: true, email: true },
        },
        currentAsset: true,
      },
    });
  }

  async findShortcuts(userId: bigint, parentFolderId: bigint | null) {
    return prisma.driveShortcut.findMany({
      where: {
        userId,
        parentFolderId,
      },
      include: {
        targetFile: {
          include: {
            currentAsset: true,
            owner: {
              select: { id: true, fullName: true, username: true, email: true },
            },
          },
        },
        targetFolder: {
          include: {
            owner: {
              select: { id: true, fullName: true, username: true, email: true },
            },
          },
        },
      },
    });
  }

  async createFolder(data: {
    name: string;
    ownerId: bigint;
    parentFolderId?: bigint | null;
    color?: string | null;
    description?: string | null;
  }) {
    return prisma.driveFolder.create({
      data: {
        name: data.name,
        ownerId: data.ownerId,
        parentFolderId: data.parentFolderId ?? null,
        color: data.color ?? null,
        description: data.description ?? null,
      },
      include: {
        owner: {
          select: { id: true, fullName: true, username: true, email: true },
        },
      },
    });
  }

  async updateFolder(
    id: bigint,
    data: {
      name?: string;
      color?: string | null;
      description?: string | null;
      parentFolderId?: bigint | null;
    },
  ) {
    return prisma.driveFolder.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.parentFolderId !== undefined && { parentFolderId: data.parentFolderId }),
      },
      include: {
        owner: {
          select: { id: true, fullName: true, username: true, email: true },
        },
      },
    });
  }

  async softDeleteFolder(id: bigint, deletedBy: bigint) {
    const now = new Date();
    return prisma.driveFolder.update({
      where: { id },
      data: {
        deletedAt: now,
        deletedBy,
      },
    });
  }

  async restoreFolder(id: bigint) {
    return prisma.driveFolder.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
      },
    });
  }

  async permanentDeleteFolder(id: bigint) {
    return prisma.driveFolder.delete({
      where: { id },
    });
  }

  async createFile(data: {
    name: string;
    ownerId: bigint;
    folderId?: bigint | null;
    assetId: bigint;
    description?: string | null;
    searchableContent?: string | null;
  }) {
    return prisma.driveFile.create({
      data: {
        name: data.name,
        ownerId: data.ownerId,
        folderId: data.folderId ?? null,
        assetId: data.assetId,
        description: data.description ?? null,
        searchableContent: data.searchableContent ?? null,
        currentVersion: 1,
      },
      include: {
        owner: {
          select: { id: true, fullName: true, username: true, email: true },
        },
        currentAsset: true,
      },
    });
  }

  async updateFile(
    id: bigint,
    data: {
      name?: string;
      description?: string | null;
      preventDownload?: boolean;
      preventEditorSharing?: boolean;
      folderId?: bigint | null;
      assetId?: bigint;
      currentVersion?: number;
    },
  ) {
    return prisma.driveFile.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.preventDownload !== undefined && { preventDownload: data.preventDownload }),
        ...(data.preventEditorSharing !== undefined && {
          preventEditorSharing: data.preventEditorSharing,
        }),
        ...(data.folderId !== undefined && { folderId: data.folderId }),
        ...(data.assetId !== undefined && { assetId: data.assetId }),
        ...(data.currentVersion !== undefined && { currentVersion: data.currentVersion }),
      },
      include: {
        owner: {
          select: { id: true, fullName: true, username: true, email: true },
        },
        currentAsset: true,
      },
    });
  }

  async softDeleteFile(id: bigint, deletedBy: bigint) {
    const now = new Date();
    return prisma.driveFile.update({
      where: { id },
      data: {
        deletedAt: now,
        deletedBy,
      },
    });
  }

  async restoreFile(id: bigint) {
    return prisma.driveFile.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
      },
    });
  }

  async permanentDeleteFile(id: bigint) {
    return prisma.driveFile.delete({
      where: { id },
    });
  }

  /**
   * Return hierarchical breadcrumbs from root to current folder.
   */
  async getBreadcrumbs(folderId: bigint): Promise<Array<{ id: string; name: string }>> {
    const rows: Array<{ id: bigint; name: string; depth: number }> = await prisma.$queryRaw`
      WITH RECURSIVE folder_path AS (
        SELECT id, name, parent_folder_id, 0 as depth
        FROM drive_folders
        WHERE id = ${folderId}

        UNION ALL

        SELECT f.id, f.name, f.parent_folder_id, fp.depth + 1
        FROM drive_folders f
        INNER JOIN folder_path fp ON f.id = fp.parent_folder_id
      )
      SELECT id, name, depth FROM folder_path ORDER BY depth DESC;
    `;

    return rows.map((r) => ({
      id: String(r.id),
      name: r.name,
    }));
  }

  /**
   * Automatically resolve duplicate names: e.g. "report.pdf" -> "report (1).pdf".
   */
  async resolveUniqueFileName(
    folderId: bigint | null,
    ownerId: bigint,
    baseName: string,
    excludeFileId?: bigint,
  ): Promise<string> {
    const existing = await prisma.driveFile.findMany({
      where: {
        folderId,
        ownerId,
        deletedAt: null,
        ...(excludeFileId ? { id: { not: excludeFileId } } : {}),
      },
      select: { name: true },
    });

    const existingNames = new Set(existing.map((f) => f.name));
    if (!existingNames.has(baseName)) {
      return baseName;
    }

    const extIndex = baseName.lastIndexOf(".");
    const stem = extIndex > 0 ? baseName.substring(0, extIndex) : baseName;
    const ext = extIndex > 0 ? baseName.substring(extIndex) : "";

    let counter = 1;
    while (true) {
      const candidate = `${stem} (${counter})${ext}`;
      if (!existingNames.has(candidate)) {
        return candidate;
      }
      counter++;
    }
  }

  /**
   * Automatically resolve duplicate folder names: e.g. "New Folder" -> "New Folder (1)".
   */
  async resolveUniqueFolderName(
    parentFolderId: bigint | null,
    ownerId: bigint,
    baseName: string,
    excludeFolderId?: bigint,
  ): Promise<string> {
    const existing = await prisma.driveFolder.findMany({
      where: {
        parentFolderId,
        ownerId,
        deletedAt: null,
        ...(excludeFolderId ? { id: { not: excludeFolderId } } : {}),
      },
      select: { name: true },
    });

    const existingNames = new Set(existing.map((f) => f.name));
    if (!existingNames.has(baseName)) {
      return baseName;
    }

    let counter = 1;
    while (true) {
      const candidate = `${baseName} (${counter})`;
      if (!existingNames.has(candidate)) {
        return candidate;
      }
      counter++;
    }
  }

  /**
   * Toggle star/favorite status for a file or folder.
   */
  async toggleFavorite(
    userId: bigint,
    target: { fileId?: bigint; folderId?: bigint },
    isStarred?: boolean,
  ): Promise<boolean> {
    const existing = await prisma.driveFavorite.findFirst({
      where: {
        userId,
        ...(target.fileId ? { fileId: target.fileId } : {}),
        ...(target.folderId ? { folderId: target.folderId } : {}),
      },
    });

    const shouldStar = isStarred !== undefined ? isStarred : !existing;

    if (shouldStar && !existing) {
      await prisma.driveFavorite.create({
        data: {
          userId,
          fileId: target.fileId ?? null,
          folderId: target.folderId ?? null,
        },
      });
      return true;
    }

    if (!shouldStar && existing) {
      await prisma.driveFavorite.delete({
        where: { id: existing.id },
      });
      return false;
    }

    return Boolean(existing);
  }

  /**
   * Check if a set of item IDs are starred by userId.
   */
  async getFavoriteStatus(
    userId: bigint,
    fileIds: bigint[],
    folderIds: bigint[],
  ): Promise<{ starredFileIds: Set<string>; starredFolderIds: Set<string> }> {
    const favorites = await prisma.driveFavorite.findMany({
      where: {
        userId,
        OR: [
          ...(fileIds.length > 0 ? [{ fileId: { in: fileIds } }] : []),
          ...(folderIds.length > 0 ? [{ folderId: { in: folderIds } }] : []),
        ],
      },
    });

    const starredFileIds = new Set<string>();
    const starredFolderIds = new Set<string>();

    for (const fav of favorites) {
      if (fav.fileId) starredFileIds.add(String(fav.fileId));
      if (fav.folderId) starredFolderIds.add(String(fav.folderId));
    }

    return { starredFileIds, starredFolderIds };
  }

  /**
   * Log or update recent item access.
   */
  async recordRecentAccess(userId: bigint, target: { fileId?: bigint; folderId?: bigint }) {
    const existing = await prisma.driveRecentItem.findFirst({
      where: {
        userId,
        ...(target.fileId ? { fileId: target.fileId } : {}),
        ...(target.folderId ? { folderId: target.folderId } : {}),
      },
    });

    if (existing) {
      return prisma.driveRecentItem.update({
        where: { id: existing.id },
        data: { accessedAt: new Date() },
      });
    }

    return prisma.driveRecentItem.create({
      data: {
        userId,
        fileId: target.fileId ?? null,
        folderId: target.folderId ?? null,
        accessedAt: new Date(),
      },
    });
  }

  /**
   * Record per-item audit activity log.
   */
  async recordActivity(data: {
    fileId?: bigint;
    folderId?: bigint;
    userId: bigint;
    action: string;
    details?: any;
  }) {
    return prisma.driveActivity.create({
      data: {
        fileId: data.fileId ?? null,
        folderId: data.folderId ?? null,
        userId: data.userId,
        action: data.action,
        details: data.details ? (data.details as Prisma.InputJsonValue) : undefined,
      },
    });
  }

  /**
   * Real user storage usage calculation across all owned FileAssets (active + trashed + versions).
   */
  async getUserStorageUsage(userId: bigint): Promise<{ usedBytes: bigint; fileCount: number }> {
    const filesResult: Array<{ sum: bigint | null; count: bigint }> = await prisma.$queryRaw`
      SELECT COALESCE(SUM(fa.bytes), 0) AS sum, COUNT(df.id) AS count
      FROM drive_files df
      INNER JOIN file_assets fa ON df.asset_id = fa.id
      WHERE df.owner_id = ${userId};
    `;

    const versionsResult: Array<{ sum: bigint | null }> = await prisma.$queryRaw`
      SELECT COALESCE(SUM(fa.bytes), 0) AS sum
      FROM drive_file_versions dfv
      INNER JOIN drive_files df ON dfv.file_id = df.id
      INNER JOIN file_assets fa ON dfv.asset_id = fa.id
      WHERE df.owner_id = ${userId};
    `;

    const filesSum = BigInt(filesResult[0]?.sum || 0);
    const versionsSum = BigInt(versionsResult[0]?.sum || 0);
    const fileCount = Number(filesResult[0]?.count || 0);

    return {
      usedBytes: filesSum + versionsSum,
      fileCount,
    };
  }
}

export const driveRepository = new DriveRepository();
export default driveRepository;
