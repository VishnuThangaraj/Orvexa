import React, { useState, useEffect } from "react";
import {
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  AlertCircle,
  FileCode,
  Loader2,
} from "lucide-react";
import { useDriveStore } from "../store/drive.store";
import { driveApi } from "../api/drive.api";
import { formatBytes, getFileTypeInfo } from "../utils/drive.utils";
import api from "@/common/service/api";

interface PreviewLoadState {
  key: string;
  textContent: string | null;
  blobUrl: string | null;
  error: string | null;
}

function getErrorMessage(err: unknown, fallback: string): string {
  const errObj = err as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return errObj?.response?.data?.message || errObj?.message || fallback;
}

export const DrivePreviewModal: React.FC = () => {
  const {
    previewFile,
    previewLinkToken,
    setPreviewFile,
    navigatePreview,
    previewFolderFiles,
  } = useDriveStore();

  const [loadState, setLoadState] = useState<PreviewLoadState>({
    key: "",
    textContent: null,
    blobUrl: null,
    error: null,
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const [actionErrorState, setActionErrorState] = useState<{
    key: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPreviewFile(null);
      } else if (e.key === "ArrowLeft") {
        navigatePreview("prev");
      } else if (e.key === "ArrowRight") {
        navigatePreview("next");
      }
    };
    if (previewFile) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewFile, navigatePreview, setPreviewFile]);

  const previewKey = previewFile
    ? `${previewFile.id}:${previewFile.currentVersion}:${previewLinkToken ?? ""}`
    : "";

  // Load authenticated text or binary blob preview when previewFile changes
  useEffect(() => {
    if (!previewFile) {
      return;
    }

    const controller = new AbortController();
    let objectUrlToRevoke: string | null = null;

    const typeInfo = getFileTypeInfo(
      previewFile.asset?.mimeType,
      previewFile.name,
    );
    const isTextPreview =
      typeInfo.category === "code" ||
      Boolean(previewFile.asset?.mimeType?.toLowerCase().startsWith("text/"));
    const isBinaryPreview =
      !isTextPreview &&
      ["image", "pdf", "video", "audio"].includes(typeInfo.category);

    if (isTextPreview) {
      api
        .get(`/drive/files/${previewFile.id}/stream`, {
          params: previewLinkToken ? { token: previewLinkToken } : undefined,
          responseType: "text",
          signal: controller.signal,
        })
        .then((res) => {
          if (controller.signal.aborted) return;
          setLoadState({
            key: previewKey,
            textContent:
              typeof res.data === "string"
                ? res.data
                : JSON.stringify(res.data, null, 2),
            blobUrl: null,
            error: null,
          });
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          setLoadState({
            key: previewKey,
            textContent: null,
            blobUrl: null,
            error: getErrorMessage(err, "Failed to load file contents"),
          });
        });
    } else if (isBinaryPreview) {
      driveApi
        .fetchFileStreamBlob(previewFile.id, {
          token: previewLinkToken ?? undefined,
          mimeType: previewFile.asset?.mimeType,
          signal: controller.signal,
        })
        .then(({ url }) => {
          if (controller.signal.aborted) {
            window.URL.revokeObjectURL(url);
            return;
          }
          objectUrlToRevoke = url;
          setLoadState({
            key: previewKey,
            textContent: null,
            blobUrl: url,
            error: null,
          });
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          setLoadState({
            key: previewKey,
            textContent: null,
            blobUrl: null,
            error: getErrorMessage(err, "Failed to load file preview"),
          });
        });
    }

    return () => {
      controller.abort();
      if (objectUrlToRevoke) {
        window.URL.revokeObjectURL(objectUrlToRevoke);
      }
    };
  }, [previewFile, previewLinkToken, previewKey]);

  if (!previewFile) return null;

  const typeInfo = getFileTypeInfo(previewFile.asset?.mimeType, previewFile.name);
  const isTextPreview =
    typeInfo.category === "code" ||
    Boolean(previewFile.asset?.mimeType?.toLowerCase().startsWith("text/"));
  const isBinaryPreview =
    !isTextPreview &&
    ["image", "pdf", "video", "audio"].includes(typeInfo.category);

  const isCurrentLoaded = loadState.key === previewKey;
  const isLoading = (isTextPreview || isBinaryPreview) && !isCurrentLoaded;
  const previewBlobUrl = isCurrentLoaded ? loadState.blobUrl : null;
  const textContent = isCurrentLoaded ? loadState.textContent : null;
  const loadError = isCurrentLoaded ? loadState.error : null;
  const actionError =
    actionErrorState?.key === previewKey ? actionErrorState.message : null;

  const isDownloadAllowed = !previewFile.preventDownload;
  const hasMultipleFiles = previewFolderFiles.length > 1;

  const handleDownload = async () => {
    if (!isDownloadAllowed || isDownloading) return;
    setActionErrorState(null);
    setIsDownloading(true);
    try {
      await driveApi.downloadFile(
        previewFile.id,
        previewFile.name,
        previewLinkToken ?? undefined,
      );
    } catch (err: unknown) {
      setActionErrorState({
        key: previewKey,
        message: getErrorMessage(err, "Failed to download file"),
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenInNewTab = async () => {
    setActionErrorState(null);
    try {
      if (previewBlobUrl) {
        window.open(previewBlobUrl, "_blank", "noopener,noreferrer");
        return;
      }
      const { url } = await driveApi.fetchFileStreamBlob(previewFile.id, {
        token: previewLinkToken ?? undefined,
        mimeType: previewFile.asset?.mimeType,
      });
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 60_000);
    } catch (err: unknown) {
      setActionErrorState({
        key: previewKey,
        message: getErrorMessage(err, "Failed to open file"),
      });
    }
  };

  const renderDownloadButton = (label = "Download file") =>
    isDownloadAllowed ? (
      <button
        type="button"
        onClick={handleDownload}
        disabled={isDownloading}
        className="flex items-center gap-2 px-5 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] disabled:opacity-60 text-white text-sm font-medium rounded-full transition-colors cursor-pointer shadow-md"
      >
        {isDownloading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Download size={16} />
        )}
        <span>{isDownloading ? "Downloading..." : label}</span>
      </button>
    ) : (
      <p className="text-xs text-rose-400">
        Download disabled by file owner.
      </p>
    );

  const renderBinaryErrorOrLoading = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-white/80">
          <Loader2 size={36} className="animate-spin text-[#8ab4f8] mb-3" />
          <p className="text-sm">Loading preview...</p>
        </div>
      );
    }

    if (loadError || !previewBlobUrl) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full text-center">
          <AlertCircle size={48} className="text-rose-400 mb-3" />
          <h3 className="text-lg font-semibold text-white mb-1.5 truncate max-w-xs">
            {previewFile.name}
          </h3>
          <p className="text-sm text-rose-300 mb-6">
            {loadError || "Failed to load file preview."}
          </p>
          {renderDownloadButton()}
        </div>
      );
    }

    return null;
  };

  const renderContent = () => {
    if (isTextPreview) {
      return (
        <div className="w-full max-w-5xl h-[85vh] bg-[#1e1e1e] text-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-800">
          <div className="h-10 px-4 bg-[#252526] border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <FileCode size={14} className="text-indigo-400" />
              {previewFile.name}
            </span>
            <span>{formatBytes(previewFile.asset?.bytes || 0)}</span>
          </div>
          <div className="flex-1 p-5 overflow-auto font-mono text-xs leading-relaxed">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-slate-400 gap-2">
                <Loader2 size={18} className="animate-spin" />
                <span>Loading file content...</span>
              </div>
            ) : loadError ? (
              <div className="flex flex-col items-center justify-center h-full text-rose-400">
                <AlertCircle size={28} className="mb-2" />
                <p>{loadError}</p>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap break-words">{textContent}</pre>
            )}
          </div>
        </div>
      );
    }

    switch (typeInfo.category) {
      case "image": {
        const fallbackState = renderBinaryErrorOrLoading();
        if (fallbackState) return fallbackState;
        return (
          <div className="flex items-center justify-center w-full h-full p-4">
            <img
              src={previewBlobUrl!}
              alt={previewFile.name}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        );
      }

      case "pdf": {
        const fallbackState = renderBinaryErrorOrLoading();
        if (fallbackState) return fallbackState;
        return (
          <div className="w-full max-w-5xl h-[85vh] bg-white rounded-xl shadow-2xl overflow-hidden">
            <object
              data={previewBlobUrl!}
              type="application/pdf"
              className="w-full h-full"
            >
              <div className="flex flex-col items-center justify-center h-full p-6 text-slate-800 text-center">
                <FileText size={48} className="text-red-500 mb-3" />
                <p className="font-semibold text-lg mb-2">PDF Preview Unavailable</p>
                <p className="text-sm text-slate-500 mb-4">
                  Your browser does not support embedded PDF viewing.
                </p>
                {renderDownloadButton("Download PDF")}
              </div>
            </object>
          </div>
        );
      }

      case "video": {
        const fallbackState = renderBinaryErrorOrLoading();
        if (fallbackState) return fallbackState;
        return (
          <div className="flex items-center justify-center w-full h-full p-4">
            <video
              controls
              autoPlay
              src={previewBlobUrl!}
              className="max-w-full max-h-[85vh] rounded-xl shadow-2xl bg-black outline-none"
            >
              Your browser does not support HTML5 video streaming.
            </video>
          </div>
        );
      }

      case "audio": {
        const fallbackState = renderBinaryErrorOrLoading();
        if (fallbackState) return fallbackState;
        return (
          <div className="flex flex-col items-center justify-center p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full">
            <div className="w-24 h-24 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
              <FileText size={48} className="text-amber-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2 text-center truncate max-w-xs">
              {previewFile.name}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              {formatBytes(previewFile.asset?.bytes || 0)}
            </p>
            <audio controls src={previewBlobUrl!} className="w-full" autoPlay>
              Your browser does not support HTML5 audio.
            </audio>
          </div>
        );
      }

      default:
        return (
          <div className="flex flex-col items-center justify-center p-8 bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full text-center">
            <FileText size={56} className="text-slate-400 mb-4 stroke-1" />
            <h3 className="text-lg font-semibold text-white mb-1.5 truncate max-w-xs">
              {previewFile.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {typeInfo.label} • {formatBytes(previewFile.asset?.bytes || 0)}
            </p>
            <p className="text-sm text-slate-400 mb-6">
              No preview available for this file type.
            </p>
            {renderDownloadButton()}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs select-none animate-in fade-in duration-200">
      {/* Top Header Controls */}
      <div className="absolute top-0 inset-x-0 h-16 px-6 flex items-center justify-between text-white z-50 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setPreviewFile(null)}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
          <span className="font-medium text-sm truncate max-w-md">
            {previewFile.name}
          </span>
          <span className="text-xs text-white/50 px-2 py-0.5 rounded-full bg-white/10 hidden sm:inline-block">
            v{previewFile.currentVersion}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenInNewTab}
            title="Open in new window"
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <ExternalLink size={18} />
          </button>

          {isDownloadAllowed && (
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              title="Download"
              className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 disabled:opacity-60 text-white text-xs font-semibold rounded-full transition-colors cursor-pointer"
            >
              {isDownloading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Download size={15} />
              )}
              <span>{isDownloading ? "Downloading..." : "Download"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Error Banner */}
      {actionError && (
        <div className="absolute top-16 inset-x-0 flex justify-center z-50 px-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-600/95 text-white text-xs font-medium shadow-lg">
            <AlertCircle size={14} />
            <span>{actionError}</span>
          </div>
        </div>
      )}

      {/* Navigation Arrows */}
      {hasMultipleFiles && (
        <>
          <button
            type="button"
            onClick={() => navigatePreview("prev")}
            title="Previous (Left arrow)"
            className="absolute left-4 p-3 rounded-full bg-black/40 hover:bg-black/70 text-white/80 hover:text-white transition-all cursor-pointer z-50"
          >
            <ChevronLeft size={28} />
          </button>

          <button
            type="button"
            onClick={() => navigatePreview("next")}
            title="Next (Right arrow)"
            className="absolute right-4 p-3 rounded-full bg-black/40 hover:bg-black/70 text-white/80 hover:text-white transition-all cursor-pointer z-50"
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}

      {/* Viewer Body */}
      <div className="w-full h-full flex items-center justify-center p-8 pt-20">
        {renderContent()}
      </div>
    </div>
  );
};
