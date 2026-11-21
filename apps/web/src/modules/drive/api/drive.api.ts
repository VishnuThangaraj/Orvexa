import api, { API_BASE_URL } from "@/common/service/api";
import type { ApiResponse } from "@/modules/auth/types";
import type {
  DriveAccessRequestItem,
  DriveActivityItem,
  DriveFileItem,
  DriveFolderItem,
  DriveResolvedLinkResult,
  DriveSearchResultsResult,
  DriveShareLinkInfo,
  DriveSharePermission,
  DriveSharedWithMeResult,
  DriveUserSummary,
  FileVersionsListResult,
  ListDriveItemsResult,
  ListPermissionsResult,
  StorageUsageResult,
} from "../types/drive.types";

export const driveApi = {
  /**
   * List folders and files inside a folder (or root).
   */
  getItems: async (options?: {
    folderId?: string | null;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: string;
    isTrash?: boolean;
  }): Promise<ListDriveItemsResult> => {
    const res = await api.get<ApiResponse<ListDriveItemsResult>>("/drive/files", {
      params: options,
    });
    return res.data.data;
  },

  /**
   * Create a new folder.
   */
  createFolder: async (payload: {
    name: string;
    parentFolderId?: string | null;
    color?: string | null;
    description?: string | null;
  }): Promise<DriveFolderItem> => {
    const res = await api.post<ApiResponse<DriveFolderItem>>("/drive/folders", payload);
    return res.data.data;
  },

  /**
   * Get folder details.
   */
  getFolder: async (folderId: string): Promise<DriveFolderItem> => {
    const res = await api.get<ApiResponse<DriveFolderItem>>(`/drive/folders/${folderId}`);
    return res.data.data;
  },

  /**
   * Update folder metadata.
   */
  updateFolder: async (
    folderId: string,
    payload: { name?: string; color?: string | null; description?: string | null },
  ): Promise<DriveFolderItem> => {
    const res = await api.patch<ApiResponse<DriveFolderItem>>(
      `/drive/folders/${folderId}`,
      payload,
    );
    return res.data.data;
  },

  /**
   * Soft-delete folder to Trash.
   */
  deleteFolder: async (folderId: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete<ApiResponse<{ success: boolean; message: string }>>(
      `/drive/folders/${folderId}`,
    );
    return res.data.data;
  },

  /**
   * Restore folder from Trash.
   */
  restoreFolder: async (folderId: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.post<ApiResponse<{ success: boolean; message: string }>>(
      `/drive/folders/${folderId}/restore`,
    );
    return res.data.data;
  },

  /**
   * Permanently delete folder and all contents.
   */
  permanentDeleteFolder: async (
    folderId: string,
  ): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete<ApiResponse<{ success: boolean; message: string }>>(
      `/drive/folders/${folderId}/permanent`,
    );
    return res.data.data;
  },

  /**
   * Get file details.
   */
  getFile: async (fileId: string, token?: string): Promise<DriveFileItem> => {
    const res = await api.get<ApiResponse<DriveFileItem>>(`/drive/files/${fileId}`, {
      params: { token },
    });
    return res.data.data;
  },

  /**
   * Update file metadata or restriction flags.
   */
  updateFile: async (
    fileId: string,
    payload: {
      name?: string;
      description?: string | null;
      preventDownload?: boolean;
      preventEditorSharing?: boolean;
    },
  ): Promise<DriveFileItem> => {
    const res = await api.patch<ApiResponse<DriveFileItem>>(`/drive/files/${fileId}`, payload);
    return res.data.data;
  },

  /**
   * Soft-delete file to Trash.
   */
  deleteFile: async (fileId: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete<ApiResponse<{ success: boolean; message: string }>>(
      `/drive/files/${fileId}`,
    );
    return res.data.data;
  },

  /**
   * Restore file from Trash.
   */
  restoreFile: async (fileId: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.post<ApiResponse<{ success: boolean; message: string }>>(
      `/drive/files/${fileId}/restore`,
    );
    return res.data.data;
  },

  /**
   * Permanently delete file.
   */
  permanentDeleteFile: async (
    fileId: string,
  ): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete<ApiResponse<{ success: boolean; message: string }>>(
      `/drive/files/${fileId}/permanent`,
    );
    return res.data.data;
  },

  /**
   * Move items to destination folder.
   */
  moveItems: async (payload: {
    items: Array<{ id: string; type: "file" | "folder" }>;
    destinationFolderId?: string | null;
  }): Promise<{ success: boolean; message: string }> => {
    const res = await api.post<ApiResponse<{ success: boolean; message: string }>>(
      "/drive/move",
      payload,
    );
    return res.data.data;
  },

  /**
   * Make a copy of a file.
   */
  copyItem: async (payload: {
    fileId: string;
    targetFolderId?: string | null;
  }): Promise<DriveFileItem> => {
    const res = await api.post<ApiResponse<DriveFileItem>>("/drive/copy", payload);
    return res.data.data;
  },

  /**
   * Toggle star/favorite status.
   */
  toggleStar: async (payload: {
    id: string;
    type: "file" | "folder";
    isStarred?: boolean;
  }): Promise<{ id: string; isStarred: boolean }> => {
    const res = await api.post<ApiResponse<{ id: string; isStarred: boolean }>>(
      "/drive/star",
      payload,
    );
    return res.data.data;
  },

  /**
   * Fetch real computed storage usage.
   */
  getStorageUsage: async (): Promise<StorageUsageResult> => {
    const res = await api.get<ApiResponse<StorageUsageResult>>("/drive/storage");
    return res.data.data;
  },

  /**
   * Upload single or multi files (multipart/form-data) with progress tracking.
   */
  uploadFiles: async (
    files: File[],
    folderId?: string | null,
    relativePaths?: string[],
    onProgress?: (progressPercent: number) => void,
    signal?: AbortSignal,
  ): Promise<DriveFileItem[]> => {
    const formData = new FormData();
    if (folderId) {
      formData.append("folderId", folderId);
    }
    if (relativePaths && relativePaths.length > 0) {
      formData.append("paths", JSON.stringify(relativePaths));
    }

    files.forEach((file) => {
      formData.append("files", file);
    });

    const res = await api.post<ApiResponse<DriveFileItem[]>>("/drive/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      signal,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    return res.data.data;
  },

  /**
   * Initialize chunked upload session.
   */
  initUploadSession: async (payload: {
    filename: string;
    mimeType: string;
    totalBytes: number;
    folderId?: string | null;
    targetFileId?: string | null;
    chunkSize?: number;
  }): Promise<{
    sessionId: string;
    chunkSize: number;
    totalChunks: number;
    expiresAt: string;
  }> => {
    const res = await api.post<
      ApiResponse<{
        sessionId: string;
        chunkSize: number;
        totalChunks: number;
        expiresAt: string;
      }>
    >("/drive/upload/init", payload);
    return res.data.data;
  },

  /**
   * Upload individual chunk for resumable session.
   */
  uploadChunk: async (
    sessionId: string,
    chunkIndex: number,
    chunkBlob: Blob,
    onProgress?: (percent: number) => void,
    signal?: AbortSignal,
  ): Promise<{
    sessionId: string;
    chunkIndex: number;
    completedChunks: number;
    totalChunks: number;
  }> => {
    const formData = new FormData();
    formData.append("chunk", chunkBlob);

    const res = await api.patch<
      ApiResponse<{
        sessionId: string;
        chunkIndex: number;
        completedChunks: number;
        totalChunks: number;
      }>
    >(`/drive/upload/${sessionId}/chunk?chunkIndex=${chunkIndex}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      signal,
      onUploadProgress: (e) => {
        if (e.total && onProgress) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
    return res.data.data;
  },

  /**
   * Complete chunked upload session.
   */
  completeUploadSession: async (sessionId: string): Promise<DriveFileItem> => {
    const res = await api.post<ApiResponse<DriveFileItem>>(
      `/drive/upload/${sessionId}/complete`,
    );
    return res.data.data;
  },

  /**
   * Abort chunked upload session.
   */
  abortUploadSession: async (
    sessionId: string,
  ): Promise<{ success: boolean; message: string }> => {
    const res = await api.post<ApiResponse<{ success: boolean; message: string }>>(
      `/drive/upload/${sessionId}/abort`,
    );
    return res.data.data;
  },

  /**
   * Helper to construct authenticated download URL.
   */
  getDownloadUrl: (fileId: string, token?: string): string => {
    const query = token ? `?token=${encodeURIComponent(token)}` : "";
    return `${API_BASE_URL}/drive/files/${fileId}/download${query}`;
  },

  /**
   * Helper to construct preview/stream URL.
   */
  getStreamUrl: (fileId: string, token?: string): string => {
    const query = token ? `?token=${encodeURIComponent(token)}` : "";
    return `${API_BASE_URL}/drive/files/${fileId}/stream${query}`;
  },

  /**
   * Helper to construct thumbnail URL.
   */
  getThumbnailUrl: (fileId: string, width = 200, height = 200, token?: string): string => {
    const queryParts = [`width=${width}`, `height=${height}`];
    if (token) queryParts.push(`token=${encodeURIComponent(token)}`);
    return `${API_BASE_URL}/drive/files/${fileId}/thumbnail?${queryParts.join("&")}`;
  },

  /**
   * Trigger streamed ZIP download for multiple files or folders.
   */
  downloadZip: async (items: Array<{ id: string; type: "file" | "folder" }>) => {
    const res = await api.post("/drive/download-zip", { items }, { responseType: "blob" });
    const blob = new Blob([res.data], { type: "application/zip" });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `drive_export_${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },

  /**
   * Autocomplete search for collaborators by name or email.
   */
  searchUsers: async (query: string): Promise<DriveUserSummary[]> => {
    const res = await api.get<ApiResponse<DriveUserSummary[]>>("/drive/users", {
      params: { q: query },
    });
    return res.data.data;
  },

  /**
   * List collaborators, general link settings, and owner for a file or folder.
   */
  listPermissions: async (target: {
    fileId?: string;
    folderId?: string;
  }): Promise<ListPermissionsResult> => {
    const url = target.fileId
      ? `/drive/files/${target.fileId}/permissions`
      : `/drive/folders/${target.folderId}/permissions`;
    const res = await api.get<ApiResponse<ListPermissionsResult>>(url);
    return res.data.data;
  },

  /**
   * Add a collaborator to a file or folder.
   */
  addPermission: async (
    target: { fileId?: string; folderId?: string },
    payload: {
      email: string;
      accessLevel: "VIEWER" | "COMMENTER" | "EDITOR" | "MANAGER";
      notify?: boolean;
    },
  ): Promise<DriveSharePermission> => {
    const url = target.fileId
      ? `/drive/files/${target.fileId}/permissions`
      : `/drive/folders/${target.folderId}/permissions`;
    const res = await api.post<ApiResponse<DriveSharePermission>>(url, payload);
    return res.data.data;
  },

  /**
   * Update an existing collaborator's access level.
   */
  updatePermission: async (
    permissionId: string,
    accessLevel: "VIEWER" | "COMMENTER" | "EDITOR" | "MANAGER",
  ): Promise<DriveSharePermission> => {
    const res = await api.patch<ApiResponse<DriveSharePermission>>(
      `/drive/permissions/${permissionId}`,
      { accessLevel },
    );
    return res.data.data;
  },

  /**
   * Remove a collaborator's access.
   */
  removePermission: async (
    permissionId: string,
  ): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete<ApiResponse<{ success: boolean; message: string }>>(
      `/drive/permissions/${permissionId}`,
    );
    return res.data.data;
  },

  /**
   * Update or revoke general link sharing settings.
   */
  updateShareLink: async (
    target: { fileId?: string; folderId?: string },
    payload: {
      role: "VIEWER" | "COMMENTER" | "EDITOR";
      allowAnonymous?: boolean;
      expiresAt?: string | null;
      regenerateToken?: boolean;
      revoke?: boolean;
    },
  ): Promise<{ revoked: boolean; shareLink: DriveShareLinkInfo | null }> => {
    const url = target.fileId
      ? `/drive/files/${target.fileId}/link`
      : `/drive/folders/${target.folderId}/link`;
    const res = await api.post<
      ApiResponse<{ revoked: boolean; shareLink: DriveShareLinkInfo | null }>
    >(url, payload);
    return res.data.data;
  },

  /**
   * Resolve a share link token for direct access or access request.
   */
  resolveShareLink: async (token: string): Promise<DriveResolvedLinkResult> => {
    const res = await api.get<ApiResponse<DriveResolvedLinkResult>>(
      `/drive/links/${token}/resolve`,
    );
    return res.data.data;
  },

  /**
   * Create an access request for a restricted item.
   */
  createAccessRequest: async (payload: {
    fileId?: string;
    folderId?: string;
    requestedRole: "VIEWER" | "COMMENTER" | "EDITOR";
    message?: string;
  }): Promise<{ id: string; status: string; message?: string }> => {
    const res = await api.post<
      ApiResponse<{ id: string; status: string; message?: string }>
    >("/drive/access-requests", payload);
    return res.data.data;
  },

  /**
   * List pending access requests for items owned by the current user.
   */
  listAccessRequests: async (): Promise<DriveAccessRequestItem[]> => {
    const res = await api.get<ApiResponse<DriveAccessRequestItem[]>>(
      "/drive/access-requests",
    );
    return res.data.data;
  },

  /**
   * Approve or deny a pending access request.
   */
  respondAccessRequest: async (
    requestId: string,
    payload: {
      decision: "APPROVE" | "DENY";
      grantedRole?: "VIEWER" | "COMMENTER" | "EDITOR";
    },
  ): Promise<{ id: string; status: string }> => {
    const res = await api.post<ApiResponse<{ id: string; status: string }>>(
      `/drive/access-requests/${requestId}/respond`,
      payload,
    );
    return res.data.data;
  },

  /**
   * List items shared with the current user.
   */
  getSharedWithMe: async (options?: {
    limit?: number;
    offset?: number;
  }): Promise<DriveSharedWithMeResult> => {
    const res = await api.get<ApiResponse<DriveSharedWithMeResult>>(
      "/drive/shared-with-me",
      { params: options },
    );
    return res.data.data;
  },

  /**
   * Create a shortcut to a file or folder in My Drive.
   */
  createShortcut: async (payload: {
    fileId?: string;
    folderId?: string;
    targetFolderId?: string | null;
  }): Promise<{ id: string; name: string }> => {
    const res = await api.post<ApiResponse<{ id: string; name: string }>>(
      "/drive/shortcuts",
      payload,
    );
    return res.data.data;
  },

  /**
   * Delete a shortcut.
   */
  deleteShortcut: async (
    shortcutId: string,
  ): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete<ApiResponse<{ success: boolean; message: string }>>(
      `/drive/shortcuts/${shortcutId}`,
    );
    return res.data.data;
  },

  /**
   * Empty all items in Trash permanently.
   */
  emptyTrash: async (): Promise<{ count: number; message: string }> => {
    const res = await api.delete<ApiResponse<{ count: number; message: string }>>(
      "/drive/trash/empty",
    );
    return res.data.data;
  },

  /**
   * List all versions of a file.
   */
  listFileVersions: async (fileId: string): Promise<FileVersionsListResult> => {
    const res = await api.get<ApiResponse<FileVersionsListResult>>(
      `/drive/files/${fileId}/versions`,
    );
    return res.data.data;
  },

  /**
   * Upload a new version of an existing file.
   */
  uploadNewVersion: async (
    fileId: string,
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<{
    fileId: string;
    versionNumber: number;
    asset: any;
    updatedAt: string;
  }> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post<
      ApiResponse<{
        fileId: string;
        versionNumber: number;
        asset: any;
        updatedAt: string;
      }>
    >(`/drive/files/${fileId}/versions`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (e.total && onProgress) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
    return res.data.data;
  },

  /**
   * Helper to construct download URL for a specific file version.
   */
  getVersionDownloadUrl: (fileId: string, versionId: string, token?: string): string => {
    const query = token ? `?token=${encodeURIComponent(token)}` : "";
    return `${API_BASE_URL}/drive/files/${fileId}/versions/${versionId}/download${query}`;
  },

  /**
   * Restore a historical file version.
   */
  restoreFileVersion: async (
    fileId: string,
    versionId: string,
  ): Promise<{ success: boolean; message: string; currentVersion: number }> => {
    const res = await api.post<
      ApiResponse<{ success: boolean; message: string; currentVersion: number }>
    >(`/drive/files/${fileId}/versions/${versionId}/restore`);
    return res.data.data;
  },

  /**
   * Delete a historical file version.
   */
  deleteFileVersion: async (
    fileId: string,
    versionId: string,
  ): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete<ApiResponse<{ success: boolean; message: string }>>(
      `/drive/files/${fileId}/versions/${versionId}`,
    );
    return res.data.data;
  },

  /**
   * Full-text search and multi-filter query.
   */
  searchItems: async (filters: {
    q?: string;
    type?: string;
    owner?: string;
    modified?: string;
    sortBy?: string;
    sortOrder?: string;
    limit?: number;
    offset?: number;
  }): Promise<DriveSearchResultsResult> => {
    const res = await api.get<ApiResponse<DriveSearchResultsResult>>(
      "/drive/search",
      { params: filters },
    );
    return res.data.data;
  },

  /**
   * Retrieve activity timeline for an item or recent drive events.
   */
  getActivities: async (params?: {
    fileId?: string;
    folderId?: string;
    limit?: number;
    offset?: number;
  }): Promise<DriveActivityItem[]> => {
    const res = await api.get<ApiResponse<DriveActivityItem[]>>(
      "/drive/activities",
      { params },
    );
    return res.data.data;
  },

  /**
   * Retrieve recently opened/modified files.
   */
  getRecent: async (limit = 50): Promise<DriveFileItem[]> => {
    const res = await api.get<ApiResponse<DriveFileItem[]>>("/drive/recent", {
      params: { limit },
    });
    return res.data.data;
  },

  getStarred: async (): Promise<{ files: DriveFileItem[]; folders: DriveFolderItem[] }> => {
    const res = await api.get<ApiResponse<{ files: DriveFileItem[]; folders: DriveFolderItem[] }>>("/drive/starred");
    return res.data.data;
  },

  /**
   * Save an external asset (from Mail, Chat, etc.) to My Drive.
   */
  saveAssetToDrive: async (payload: {
    assetId: string;
    filename?: string;
    folderId?: string | null;
  }): Promise<DriveFileItem> => {
    const res = await api.post<ApiResponse<DriveFileItem>>("/drive/save-asset", payload);
    return res.data.data;
  },

  /**
   * Batch share or verify recipient access to a Drive file.
   */
  batchShareRecipients: async (
    fileId: string,
    payload: { recipientEmails: string[]; role?: string },
  ): Promise<Array<{ fileId: string; email: string; granted: boolean }>> => {
    const res = await api.post<ApiResponse<Array<{ fileId: string; email: string; granted: boolean }>>>(
      `/drive/files/${fileId}/share-recipients`,
      payload,
    );
    return res.data.data;
  },
};

export default driveApi;
