import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Upload,
  Download,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Loader2,
  FileText,
} from "lucide-react";
import { driveApi } from "../api/drive.api";
import { formatBytes, formatDate } from "../utils/drive.utils";
import type { DriveFileItem, FileVersionsListResult } from "../types/drive.types";

interface DriveVersionHistoryDialogProps {
  isOpen: boolean;
  item: DriveFileItem | null;
  onClose: () => void;
  onVersionChanged?: () => void;
}

export const DriveVersionHistoryDialog: React.FC<DriveVersionHistoryDialogProps> = ({
  isOpen,
  item,
  onClose,
  onVersionChanged,
}) => {
  const [data, setData] = useState<FileVersionsListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadVersions = async () => {
    if (!item) return;
    setLoading(true);
    setActionError(null);
    try {
      const res = await driveApi.listFileVersions(item.id);
      setData(res);
    } catch (err: any) {
      console.error("Failed to load versions:", err);
      setActionError(err.response?.data?.message || err.message || "Failed to load versions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && item) {
      loadVersions();
      setActionSuccess(null);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setActionError(null);
    setActionSuccess(null);

    try {
      const DIRECT_UPLOAD_LIMIT = 3.5 * 1024 * 1024;
      if (file.size <= DIRECT_UPLOAD_LIMIT) {
        await driveApi.uploadNewVersion(item.id, file, (pct) => setUploadProgress(pct));
      } else {
        const CHUNK_SIZE = 3 * 1024 * 1024; // 3MB to stay under Vercel's 4.5MB limit
        const session = await driveApi.initUploadSession({
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          totalBytes: file.size,
          targetFileId: item.id,
          chunkSize: CHUNK_SIZE,
        });

        const totalChunks = session.totalChunks;
        for (let c = 0; c < totalChunks; c++) {
          const start = c * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunkBlob = file.slice(start, end);

          await driveApi.uploadChunk(session.sessionId, c, chunkBlob, (chunkPct) => {
            const overallPct = Math.round(((c + chunkPct / 100) / totalChunks) * 100);
            setUploadProgress(overallPct);
          });
        }

        await driveApi.completeUploadSession(session.sessionId);
        setUploadProgress(100);
      }
      setActionSuccess(`New version uploaded successfully!`);
      await loadVersions();
      onVersionChanged?.();
    } catch (err: any) {
      console.error("Version upload failed:", err);
      setActionError(err.response?.data?.message || err.message || "Failed to upload version");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDownloadVersion = async (versionId: string, versionNumber?: number) => {
    setActionError(null);
    try {
      if (versionId === "current") {
        await driveApi.downloadFile(item.id, item.name);
      } else {
        const dotIdx = item.name.lastIndexOf(".");
        const versionFilename =
          dotIdx > 0 && versionNumber !== undefined
            ? `${item.name.slice(0, dotIdx)}_v${versionNumber}${item.name.slice(dotIdx)}`
            : item.name;
        await driveApi.downloadVersion(item.id, versionId, versionFilename);
      }
    } catch (err: unknown) {
      console.error("Failed to download version:", err);
      setActionError(err instanceof Error ? err.message : "Failed to download file version");
    }
  };

  const handleRestoreVersion = async (versionId: string, versionNumber: number) => {
    if (
      !confirm(
        `Restore version ${versionNumber}? It will be promoted as the current active version.`,
      )
    ) {
      return;
    }

    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await driveApi.restoreFileVersion(item.id, versionId);
      setActionSuccess(res.message);
      await loadVersions();
      onVersionChanged?.();
    } catch (err: any) {
      console.error("Failed to restore version:", err);
      setActionError(err.response?.data?.message || err.message || "Failed to restore version");
    }
  };

  const handleDeleteVersion = async (versionId: string, versionNumber: number) => {
    if (
      !confirm(
        `Are you sure you want to delete version ${versionNumber} forever? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setActionError(null);
    setActionSuccess(null);
    try {
      await driveApi.deleteFileVersion(item.id, versionId);
      setActionSuccess(`Version ${versionNumber} deleted.`);
      await loadVersions();
      onVersionChanged?.();
    } catch (err: any) {
      console.error("Failed to delete version:", err);
      setActionError(err.response?.data?.message || err.message || "Failed to delete version");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={18} className="text-[#1a73e8] shrink-0" />
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
                Version history
              </h2>
              <p className="text-xs text-slate-500 truncate max-w-[320px]">
                {item.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Banners */}
        {actionError && (
          <div className="px-6 py-2.5 bg-rose-50 dark:bg-rose-950/50 border-b border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
            {actionError}
          </div>
        )}
        {actionSuccess && (
          <div className="px-6 py-2.5 bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 size={14} />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Upload Action Bar */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelected}
            className="hidden"
          />

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Keep earlier versions or restore an older state anytime.
          </p>

          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-[#1a73e8] text-white hover:bg-[#1557b0] rounded-full cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
          >
            {isUploading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Uploading {uploadProgress}%</span>
              </>
            ) : (
              <>
                <Upload size={13} />
                <span>Upload new version</span>
              </>
            )}
          </button>
        </div>

        {/* Versions Timeline List */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-[#1a73e8]" />
            </div>
          ) : !data || data.versions.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              No version history available for this file.
            </p>
          ) : (
            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {data.versions.map((ver) => (
                <div key={ver.id} className="relative group">
                  {/* Timeline Dot */}
                  <div
                    className={`absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-slate-900 ${
                      ver.isCurrent ? "bg-[#1a73e8]" : "bg-slate-400 dark:bg-slate-600"
                    }`}
                  />

                  <div className="flex items-start justify-between gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-800/40 hover:bg-slate-50/70 dark:hover:bg-slate-800/70 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {ver.isCurrent
                            ? `Version ${ver.versionNumber} (Current)`
                            : `Version ${ver.versionNumber}`}
                        </span>
                        {ver.isCurrent && (
                          <span className="px-2 py-0.5 text-[10px] font-medium bg-[#1a73e8]/10 text-[#1a73e8] rounded-full">
                            Active
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                        <p>
                          {formatDate(ver.createdAt)} &bull; {formatBytes(ver.asset.bytes)}
                        </p>
                        <p className="truncate">
                          Uploaded by: <span className="font-medium">{ver.uploader.fullName}</span>
                        </p>
                      </div>
                    </div>

                    {/* Version Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDownloadVersion(ver.id, ver.versionNumber)}
                        title="Download this version"
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md cursor-pointer transition-colors"
                      >
                        <Download size={14} />
                      </button>

                      {!ver.isCurrent && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleRestoreVersion(ver.id, ver.versionNumber)}
                            title="Restore this version as current"
                            className="p-1.5 text-[#1a73e8] hover:bg-[#1a73e8]/10 rounded-md cursor-pointer transition-colors"
                          >
                            <RotateCcw size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteVersion(ver.id, ver.versionNumber)}
                            title="Delete this version"
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md cursor-pointer transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-850">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 text-xs font-medium bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-full cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriveVersionHistoryDialog;
