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
} from "lucide-react";
import { useDriveStore } from "../store/drive.store";
import { driveApi } from "../api/drive.api";
import { formatBytes, getFileTypeInfo } from "../utils/drive.utils";
import api from "@/common/service/api";

export const DrivePreviewModal: React.FC = () => {
  const {
    previewFile,
    setPreviewFile,
    navigatePreview,
    previewFolderFiles,
  } = useDriveStore();

  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);
  const [textError, setTextError] = useState(false);

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

  // Load text file content if text/code/json/markdown
  useEffect(() => {
    if (!previewFile) {
      setTextContent(null);
      return;
    }

    const typeInfo = getFileTypeInfo(
      previewFile.asset?.mimeType,
      previewFile.name,
    );
    if (typeInfo.category === "code" || previewFile.asset?.mimeType?.startsWith("text/")) {
      setLoadingText(true);
      setTextError(false);
      api
        .get(`/drive/files/${previewFile.id}/stream`, { responseType: "text" })
        .then((res) => {
          setTextContent(typeof res.data === "string" ? res.data : JSON.stringify(res.data, null, 2));
        })
        .catch(() => setTextError(true))
        .finally(() => setLoadingText(false));
    } else {
      setTextContent(null);
    }
  }, [previewFile]);

  if (!previewFile) return null;

  const streamUrl = driveApi.getStreamUrl(previewFile.id);
  const downloadUrl = driveApi.getDownloadUrl(previewFile.id);
  const typeInfo = getFileTypeInfo(previewFile.asset?.mimeType, previewFile.name);
  const isDownloadAllowed = !previewFile.preventDownload;
  const hasMultipleFiles = previewFolderFiles.length > 1;

  const renderContent = () => {
    switch (typeInfo.category) {
      case "image":
        return (
          <div className="flex items-center justify-center w-full h-full p-4">
            <img
              src={streamUrl}
              alt={previewFile.name}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        );

      case "pdf":
        return (
          <div className="w-full max-w-5xl h-[85vh] bg-white rounded-xl shadow-2xl overflow-hidden">
            <object
              data={streamUrl}
              type="application/pdf"
              className="w-full h-full"
            >
              <div className="flex flex-col items-center justify-center h-full p-6 text-slate-800 text-center">
                <FileText size={48} className="text-red-500 mb-3" />
                <p className="font-semibold text-lg mb-2">PDF Preview Unavailable</p>
                <p className="text-sm text-slate-500 mb-4">
                  Your browser does not support embedded PDF viewing.
                </p>
                {isDownloadAllowed && (
                  <a
                    href={downloadUrl}
                    download={previewFile.name}
                    className="px-4 py-2 bg-[#1a73e8] text-white text-sm font-medium rounded-lg hover:bg-[#1557b0] transition-colors"
                  >
                    Download PDF
                  </a>
                )}
              </div>
            </object>
          </div>
        );

      case "video":
        return (
          <div className="flex items-center justify-center w-full h-full p-4">
            <video
              controls
              autoPlay
              src={streamUrl}
              className="max-w-full max-h-[85vh] rounded-xl shadow-2xl bg-black outline-none"
            >
              Your browser does not support HTML5 video streaming.
            </video>
          </div>
        );

      case "audio":
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
            <audio controls src={streamUrl} className="w-full" autoPlay>
              Your browser does not support HTML5 audio.
            </audio>
          </div>
        );

      case "code":
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
              {loadingText ? (
                <div className="flex items-center justify-center h-full text-slate-400">
                  Loading code content...
                </div>
              ) : textError ? (
                <div className="flex flex-col items-center justify-center h-full text-rose-400">
                  <AlertCircle size={28} className="mb-2" />
                  <p>Failed to load file contents</p>
                </div>
              ) : (
                <pre>{textContent}</pre>
              )}
            </div>
          </div>
        );

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
            {isDownloadAllowed ? (
              <a
                href={downloadUrl}
                download={previewFile.name}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-sm font-medium rounded-full transition-colors cursor-pointer shadow-md"
              >
                <Download size={16} />
                <span>Download file</span>
              </a>
            ) : (
              <p className="text-xs text-rose-400">
                Download disabled by file owner.
              </p>
            )}
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
          <a
            href={streamUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new window"
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <ExternalLink size={18} />
          </a>

          {isDownloadAllowed && (
            <a
              href={downloadUrl}
              download={previewFile.name}
              title="Download"
              className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-full transition-colors cursor-pointer"
            >
              <Download size={15} />
              <span>Download</span>
            </a>
          )}
        </div>
      </div>

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
