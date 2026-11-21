import prisma from "../../infrastructure/database/prisma.js";
import AppError from "../../common/errors/AppError.js";
import type { DriveAccessLevel } from "../../generated/prisma/enums.js";

export type EffectiveDriveRole = "OWNER" | DriveAccessLevel | "NONE";

const ROLE_RANK: Record<EffectiveDriveRole, number> = {
  OWNER: 50,
  MANAGER: 40,
  EDITOR: 30,
  COMMENTER: 20,
  VIEWER: 10,
  NONE: 0,
};

export class DrivePermissionService {
  /**
   * Compare two roles and return true if candidate meets or exceeds required role.
   */
  hasSufficientRole(candidate: EffectiveDriveRole, required: EffectiveDriveRole): boolean {
    return ROLE_RANK[candidate] >= ROLE_RANK[required];
  }

  /**
   * Get all ancestor folder IDs for a given folder using a recursive CTE.
   * Root-most folder is last in the returned array.
   */
  async getAncestorFolderIds(folderId: bigint): Promise<bigint[]> {
    const rows: Array<{ id: bigint }> = await prisma.$queryRaw`
      WITH RECURSIVE folder_ancestors AS (
        SELECT id, parent_folder_id
        FROM drive_folders
        WHERE id = ${folderId}

        UNION ALL

        SELECT f.id, f.parent_folder_id
        FROM drive_folders f
        INNER JOIN folder_ancestors fa ON f.id = fa.parent_folder_id
      )
      SELECT id FROM folder_ancestors WHERE id != ${folderId};
    `;

    return rows.map((r) => BigInt(r.id));
  }

  /**
   * Check if moving folderIdToMove into targetParentFolderId would create a cycle.
   * Returns true if targetParentFolderId is folderIdToMove or is a descendant of folderIdToMove.
   */
  async checkCircularMove(
    folderIdToMove: bigint,
    targetParentFolderId: bigint | null,
  ): Promise<boolean> {
    if (targetParentFolderId === null) {
      return false; // Moving to root is never circular
    }

    if (folderIdToMove === targetParentFolderId) {
      return true; // Moving folder into itself
    }

    // Check if targetParentFolderId is a descendant of folderIdToMove
    const rows: Array<{ id: bigint }> = await prisma.$queryRaw`
      WITH RECURSIVE folder_descendants AS (
        SELECT id
        FROM drive_folders
        WHERE id = ${folderIdToMove}

        UNION ALL

        SELECT f.id
        FROM drive_folders f
        INNER JOIN folder_descendants fd ON f.parent_folder_id = fd.id
      )
      SELECT id FROM folder_descendants WHERE id = ${targetParentFolderId} LIMIT 1;
    `;

    return rows.length > 0;
  }

  /**
   * Resolve the effective permission of a user on a file or folder.
   * Hierarchy:
   * 1. If user is owner -> OWNER
   * 2. Direct permission on item
   * 3. Inherited permission from nearest ancestor folder
   * 4. Link token validation (if provided)
   */
  async getEffectivePermission(
    userId: bigint,
    target: { fileId?: bigint; folderId?: bigint },
    linkToken?: string,
  ): Promise<{
    role: EffectiveDriveRole;
    isOwner: boolean;
    preventDownload: boolean;
    preventEditorSharing: boolean;
  }> {
    if (!target.fileId && !target.folderId) {
      throw new AppError("Invalid target: either fileId or folderId must be provided", 400);
    }

    let isOwner = false;
    let folderHierarchy: bigint[] = [];
    let preventDownload = false;
    let preventEditorSharing = false;

    if (target.fileId) {
      const file = await prisma.driveFile.findUnique({
        where: { id: target.fileId },
        select: {
          id: true,
          ownerId: true,
          folderId: true,
          preventDownload: true,
          preventEditorSharing: true,
          deletedAt: true,
        },
      });

      if (!file) {
        throw new AppError("File not found", 404);
      }

      if (file.ownerId === userId) {
        return {
          role: "OWNER",
          isOwner: true,
          preventDownload: file.preventDownload,
          preventEditorSharing: file.preventEditorSharing,
        };
      }

      preventDownload = file.preventDownload;
      preventEditorSharing = file.preventEditorSharing;

      if (file.folderId) {
        const ancestors = await this.getAncestorFolderIds(file.folderId);
        folderHierarchy = [file.folderId, ...ancestors];
      }
    } else if (target.folderId) {
      const folder = await prisma.driveFolder.findUnique({
        where: { id: target.folderId },
        select: {
          id: true,
          ownerId: true,
          parentFolderId: true,
          deletedAt: true,
        },
      });

      if (!folder) {
        throw new AppError("Folder not found", 404);
      }

      if (folder.ownerId === userId) {
        return {
          role: "OWNER",
          isOwner: true,
          preventDownload: false,
          preventEditorSharing: false,
        };
      }

      const ancestors = await this.getAncestorFolderIds(target.folderId);
      folderHierarchy = [target.folderId, ...ancestors];
    }

    // 1. Check direct permission on file
    if (target.fileId) {
      const directFilePerm = await prisma.drivePermission.findFirst({
        where: {
          fileId: target.fileId,
          userId,
        },
      });

      if (directFilePerm) {
        return {
          role: directFilePerm.accessLevel,
          isOwner: false,
          preventDownload,
          preventEditorSharing,
        };
      }
    }

    // 2. Check permissions on folder hierarchy (closest ancestor wins)
    for (const fId of folderHierarchy) {
      // Check if user is owner of an ancestor folder
      const ancestorFolder = await prisma.driveFolder.findUnique({
        where: { id: fId },
        select: { ownerId: true },
      });
      if (ancestorFolder?.ownerId === userId) {
        return {
          role: "OWNER",
          isOwner: true,
          preventDownload,
          preventEditorSharing,
        };
      }

      const ancestorPerm = await prisma.drivePermission.findFirst({
        where: {
          folderId: fId,
          userId,
        },
      });

      if (ancestorPerm) {
        return {
          role: ancestorPerm.accessLevel,
          isOwner: false,
          preventDownload,
          preventEditorSharing,
        };
      }
    }

    // 3. Check link access if token provided
    if (linkToken) {
      const shareLink = await prisma.driveShareLink.findUnique({
        where: { token: linkToken },
      });

      if (shareLink) {
        const isNotExpired = !shareLink.expiresAt || shareLink.expiresAt > new Date();
        const matchesTarget =
          (target.fileId && shareLink.fileId === target.fileId) ||
          (target.folderId && shareLink.folderId === target.folderId) ||
          (target.fileId &&
            shareLink.folderId &&
            folderHierarchy.includes(shareLink.folderId));

        if (isNotExpired && matchesTarget) {
          return {
            role: shareLink.role,
            isOwner: false,
            preventDownload,
            preventEditorSharing,
          };
        }
      }
    }

    return {
      role: "NONE",
      isOwner: false,
      preventDownload,
      preventEditorSharing,
    };
  }

  /**
   * Assert user has required permission, throwing 403 or 404 if denied.
   */
  async assertAccess(
    userId: bigint,
    target: { fileId?: bigint; folderId?: bigint },
    requiredRole: EffectiveDriveRole,
    linkToken?: string,
  ): Promise<{
    effectiveRole: EffectiveDriveRole;
    isOwner: boolean;
    preventDownload: boolean;
    preventEditorSharing: boolean;
  }> {
    const perm = await this.getEffectivePermission(userId, target, linkToken);

    if (!this.hasSufficientRole(perm.role, requiredRole)) {
      if (perm.role === "NONE") {
        throw new AppError("Access denied: You do not have permission to access this item", 403);
      }
      throw new AppError(
        `Access denied: Required permission level '${requiredRole}', but current level is '${perm.role}'`,
        403,
      );
    }

    return {
      effectiveRole: perm.role,
      isOwner: perm.isOwner,
      preventDownload: perm.preventDownload,
      preventEditorSharing: perm.preventEditorSharing,
    };
  }
}

export const drivePermissionService = new DrivePermissionService();
export default drivePermissionService;
