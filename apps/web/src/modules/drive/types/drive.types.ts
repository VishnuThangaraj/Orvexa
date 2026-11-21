export type DriveAccessLevel =
  | "OWNER"
  | "MANAGER"
  | "EDITOR"
  | "COMMENTER"
  | "VIEWER"
  | "NONE";

export type DriveViewSection =
  | "my-drive"
  | "shared"
  | "recent"
  | "starred"
  | "trash";

export interface DriveUserSummary {
  id: string;
  fullName: string;
  email: string;
  username?: string;
  profileImageId?: string | null;
}

export interface DriveFileAsset {
  id: string;
  mimeType: string;
  bytes: string;
  format: string | null;
  resourceType: string;
  secureUrl?: string | null;
  createdAt?: string;
}

export interface DriveBreadcrumb {
  id: string;
  name: string;
}

export interface DriveFolderItem {
  id: string;
  type: "folder";
  name: string;
  color?: string | null;
  description?: string | null;
  ownerId?: string;
  owner: DriveUserSummary;
  parentFolderId?: string | null;
  isStarred?: boolean;
  effectiveRole?: DriveAccessLevel;
  fileCount?: number;
  breadcrumbs?: DriveBreadcrumb[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface DriveFileItem {
  id: string;
  type: "file";
  name: string;
  description?: string | null;
  currentVersion: number;
  preventDownload: boolean;
  preventEditorSharing: boolean;
  ownerId?: string;
  owner: DriveUserSummary;
  asset: DriveFileAsset;
  folderId?: string | null;
  isStarred?: boolean;
  effectiveRole?: DriveAccessLevel;
  breadcrumbs?: DriveBreadcrumb[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type DriveItem = DriveFolderItem | DriveFileItem;

export interface ListDriveItemsResult {
  currentFolder: DriveFolderItem | null;
  breadcrumbs: DriveBreadcrumb[];
  folders: DriveFolderItem[];
  files: DriveFileItem[];
  shortcuts: any[];
  totalFolders: number;
  totalFiles: number;
  hasMore: boolean;
}

export interface StorageUsageResult {
  usedBytes: string;
  totalBytes: string;
  usagePercentage: number;
  fileCount: number;
}

export interface DriveUploadItem {
  id: string;
  file: File;
  filename: string;
  size: number;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error" | "cancelled";
  error?: string;
  relativePath?: string;
}

export interface DriveActivityItem {
  id: string;
  action: string;
  user: DriveUserSummary;
  details?: Record<string, any>;
  item?: {
    id: string;
    name: string;
    type: "file" | "folder";
  };
  createdAt: string;
}

export interface DriveFileVersionItem {
  id: string;
  versionNumber: number;
  isCurrent?: boolean;
  asset: DriveFileAsset;
  uploader: DriveUserSummary;
  createdAt: string;
}

export interface FileVersionsListResult {
  fileId: string;
  fileName: string;
  currentVersion: number;
  versions: (DriveFileVersionItem & { isCurrent: boolean })[];
}

export interface DriveSearchResultsResult {
  files: DriveFileItem[];
  folders: DriveFolderItem[];
  totalResults: number;
}

export interface DriveSharePermission {
  id: string;
  user: DriveUserSummary;
  accessLevel: DriveAccessLevel;
  grantedBy: DriveUserSummary;
  createdAt: string;
}

export interface DriveShareLinkInfo {
  token: string;
  role: "VIEWER" | "COMMENTER" | "EDITOR";
  allowAnonymous: boolean;
  expiresAt?: string | null;
  shareUrl: string;
}

export interface ListPermissionsResult {
  owner: DriveUserSummary;
  permissions: DriveSharePermission[];
  shareLink: DriveShareLinkInfo | null;
  canManagePermissions: boolean;
  effectiveRole: DriveAccessLevel;
}

export interface DriveAccessRequestItem {
  id: string;
  itemName: string;
  type: "file" | "folder";
  requestedRole: DriveAccessLevel;
  message?: string | null;
  requester: DriveUserSummary;
  createdAt: string;
}

export interface DriveSharedWithMeResult {
  files: (DriveFileItem & { sharedBy: DriveUserSummary; sharedAt: string })[];
  folders: (DriveFolderItem & { sharedBy: DriveUserSummary; sharedAt: string })[];
  totalCount: number;
}

export interface DriveResolvedLinkResult {
  hasAccess: boolean;
  effectiveRole: DriveAccessLevel;
  shareLink: {
    token: string;
    role: "VIEWER" | "COMMENTER" | "EDITOR";
    allowAnonymous: boolean;
    expiresAt?: string | null;
  };
  item: {
    id: string;
    name: string;
    type: "file" | "folder";
    owner: DriveUserSummary;
    preventDownload?: boolean;
    asset?: {
      id: string;
      mimeType: string;
      bytes: string;
    };
  };
}
