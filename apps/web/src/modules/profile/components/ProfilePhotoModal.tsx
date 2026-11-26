import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  Trash2,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/common/components/UserAvatar";
import type { User } from "@/modules/auth/types";
import {
  useRemoveProfilePhoto,
  useUploadProfilePhoto,
} from "../hooks/use-profile.hooks";
import axios from "axios";
import type { ApiResponse } from "@/modules/auth/types";

export interface ProfilePhotoModalProps {
  onClose: () => void;
  user: User;
  onSuccess: (message: string) => void;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export const ProfilePhotoModal: React.FC<ProfilePhotoModalProps> = ({
  onClose,
  user,
  onSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDraggingImg, setIsDraggingImg] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDropOver, setIsDropOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const uploadMutation = useUploadProfilePhoto();
  const removeMutation = useRemoveProfilePhoto();

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const isBusy = uploadMutation.isPending || removeMutation.isPending;

  const handleFileSelected = (file?: File | null) => {
    setErrorMsg(null);
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type.toLowerCase())) {
      setErrorMsg("Please select a JPEG, PNG, WebP, or GIF image.");
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setErrorMsg("Image must be 5 MB or smaller.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const renderCroppedFile = async (): Promise<File> => {
    if (!selectedFile || !previewUrl) {
      throw new Error("No image selected");
    }

    // If unmodified and no zoom/pan, upload directly (unless animated GIF)
    if (zoom === 1 && offset.x === 0 && offset.y === 0) {
      return selectedFile;
    }

    return new Promise<File>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const outputSize = 512;
        const previewDiameter = 208;
        const canvas = document.createElement("canvas");
        canvas.width = outputSize;
        canvas.height = outputSize;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(selectedFile);
          return;
        }

        const scaleToCover = Math.max(
          outputSize / img.naturalWidth,
          outputSize / img.naturalHeight,
        );
        const drawnWidth = img.naturalWidth * scaleToCover * zoom;
        const drawnHeight = img.naturalHeight * scaleToCover * zoom;
        const ratio = outputSize / previewDiameter;

        const dx = (outputSize - drawnWidth) / 2 + offset.x * ratio;
        const dy = (outputSize - drawnHeight) / 2 + offset.y * ratio;

        ctx.drawImage(img, dx, dy, drawnWidth, drawnHeight);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(selectedFile);
              return;
            }
            resolve(
              new File([blob], "avatar.webp", { type: "image/webp" }),
            );
          },
          "image/webp",
          0.9,
        );
      };
      img.onerror = () => reject(new Error("Could not process selected image"));
      img.src = previewUrl;
    });
  };

  const handleSavePhoto = async () => {
    if (!selectedFile) return;
    setErrorMsg(null);
    setUploadProgress(0);

    try {
      const fileToUpload = await renderCroppedFile();
      await uploadMutation.mutateAsync({
        file: fileToUpload,
        onProgress: setUploadProgress,
      });
      onSuccess("Profile picture updated");
      onClose();
    } catch (err) {
      let message = "Failed to upload profile picture. Please try again.";
      if (axios.isAxiosError<ApiResponse<null>>(err) && err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err instanceof Error && err.message) {
        message = err.message;
      }
      setErrorMsg(message);
    }
  };

  const handleRemovePhoto = async () => {
    setErrorMsg(null);
    try {
      await removeMutation.mutateAsync();
      onSuccess("Profile picture removed");
      onClose();
    } catch (err) {
      let message = "Failed to remove profile picture.";
      if (axios.isAxiosError<ApiResponse<null>>(err) && err.response?.data?.message) {
        message = err.response.data.message;
      }
      setErrorMsg(message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-modal-title"
    >
      <div className="w-full max-w-md bg-white dark:bg-[#1e1f20] text-[#1f1f1f] dark:text-[#e3e3e3] rounded-[28px] shadow-2xl border border-[#e1e3e1] dark:border-[#333537] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <Camera size={20} className="text-[#0b57d0] dark:text-[#a8c7fa]" />
            <h3 id="photo-modal-title" className="text-lg font-medium">
              Profile picture
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            aria-label="Close modal"
            className="p-2 rounded-full text-[#444746] dark:text-[#c4c7c5] hover:bg-[#1f1f1f]/6 dark:hover:bg-[#e3e3e3]/8 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          <p className="text-sm text-[#444746] dark:text-[#c4c7c5]">
            A picture helps people recognize you across Orvexa Mail, Chat, Meet, and Drive.
          </p>

          {/* Avatar / Crop Preview */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDropOver(true);
            }}
            onDragLeave={() => setIsDropOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDropOver(false);
              handleFileSelected(e.dataTransfer.files?.[0]);
            }}
            className={`flex flex-col items-center justify-center rounded-3xl p-6 border-2 border-dashed transition-colors ${
              isDropOver
                ? "border-[#0b57d0] dark:border-[#a8c7fa] bg-[#d3e3fd]/25 dark:bg-[#004a77]/25"
                : "border-[#dadce0] dark:border-[#3c4043] bg-[#f8fafd] dark:bg-[#131314]"
            }`}
          >
            {previewUrl ? (
              <div className="flex flex-col items-center gap-4 w-full">
                <div
                  className="relative w-52 h-52 rounded-full overflow-hidden ring-4 ring-[#d3e3fd] dark:ring-[#004a77] cursor-grab active:cursor-grabbing select-none bg-black/10"
                  onPointerDown={(e) => {
                    setIsDraggingImg(true);
                    setDragStart({
                      x: e.clientX - offset.x,
                      y: e.clientY - offset.y,
                    });
                  }}
                  onPointerMove={(e) => {
                    if (!isDraggingImg) return;
                    const maxShift = 72 * zoom;
                    const nextX = Math.max(
                      -maxShift,
                      Math.min(maxShift, e.clientX - dragStart.x),
                    );
                    const nextY = Math.max(
                      -maxShift,
                      Math.min(maxShift, e.clientY - dragStart.y),
                    );
                    setOffset({ x: nextX, y: nextY });
                  }}
                  onPointerUp={() => setIsDraggingImg(false)}
                  onPointerLeave={() => setIsDraggingImg(false)}
                >
                  <img
                    src={previewUrl}
                    alt="Preview"
                    draggable={false}
                    style={{
                      transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    }}
                    className="w-full h-full object-cover transition-transform duration-75"
                  />
                </div>

                {/* Zoom & Reset Controls */}
                <div className="flex items-center gap-3 w-full max-w-64">
                  <ZoomOut
                    size={16}
                    className="text-[#444746] dark:text-[#c4c7c5] shrink-0"
                  />
                  <input
                    type="range"
                    min={1}
                    max={2.5}
                    step={0.05}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    aria-label="Zoom image"
                    className="w-full accent-[#0b57d0] dark:accent-[#a8c7fa] cursor-pointer"
                  />
                  <ZoomIn
                    size={16}
                    className="text-[#444746] dark:text-[#c4c7c5] shrink-0"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setZoom(1);
                      setOffset({ x: 0, y: 0 });
                    }}
                    title="Reset framing"
                    className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#444746] dark:text-[#c4c7c5] cursor-pointer"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
                <span className="text-xs text-[#444746] dark:text-[#c4c7c5]">
                  Drag image to reposition • Adjust zoom
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <UserAvatar
                  src={user.profileImage?.secureUrl}
                  name={user.fullName}
                  username={user.username}
                  size="2xl"
                  className="w-32 h-32 text-4xl ring-4 ring-white dark:ring-[#282a2c] shadow-md"
                />
                <span className="text-xs text-[#444746] dark:text-[#c4c7c5] text-center">
                  Drag and drop an image here, or choose a file (max 5 MB)
                </span>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              className="hidden"
              onChange={(e) => handleFileSelected(e.target.files?.[0])}
            />
          </div>

          {uploadMutation.isPending && uploadProgress > 0 && (
            <div className="space-y-1">
              <div className="h-1.5 w-full rounded-full bg-[#e1e3e1] dark:bg-[#333537] overflow-hidden">
                <div
                  className="h-full bg-[#0b57d0] dark:bg-[#a8c7fa] transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-[#444746] dark:text-[#c4c7c5] text-right">
                Uploading {uploadProgress}%
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="text-xs font-medium text-[#b3261e] dark:text-[#f2b8b5] bg-[#f9dedc]/60 dark:bg-[#8c1d18]/30 px-3.5 py-2.5 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="empty"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
                className="px-4 py-2 rounded-full text-sm font-medium border border-[#747775] dark:border-[#8e918f] text-[#0b57d0] dark:text-[#a8c7fa] hover:bg-[#0b57d0]/8 dark:hover:bg-[#a8c7fa]/10 gap-2"
              >
                <Upload size={15} />
                <span>{selectedFile ? "Choose another" : "Upload photo"}</span>
              </Button>

              {user.profileImage?.secureUrl && !selectedFile && (
                <Button
                  type="button"
                  variant="empty"
                  onClick={handleRemovePhoto}
                  disabled={isBusy}
                  loading={removeMutation.isPending}
                  className="px-4 py-2 rounded-full text-sm font-medium border border-[#e1e3e1] dark:border-[#3c4043] text-[#b3261e] dark:text-[#f2b8b5] hover:bg-[#b3261e]/8 dark:hover:bg-[#f2b8b5]/10 gap-1.5"
                >
                  <Trash2 size={14} />
                  <span>Remove</span>
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Button
                type="button"
                variant="empty"
                onClick={onClose}
                disabled={isBusy}
                className="px-4 py-2 rounded-full text-sm font-medium text-[#0b57d0] dark:text-[#a8c7fa] hover:bg-[#0b57d0]/8 dark:hover:bg-[#a8c7fa]/10"
              >
                Cancel
              </Button>
              {selectedFile && (
                <Button
                  type="button"
                  variant="empty"
                  onClick={handleSavePhoto}
                  disabled={isBusy}
                  loading={uploadMutation.isPending}
                  className="px-5 py-2 rounded-full text-sm font-medium bg-[#0b57d0] hover:bg-[#0842a0] text-white dark:bg-[#a8c7fa] dark:hover:bg-[#b8d1fb] dark:text-[#062e6f]"
                >
                  Save as profile picture
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePhotoModal;
