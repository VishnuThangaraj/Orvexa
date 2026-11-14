import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import AppError from "../common/errors/AppError.js";

export interface UploadMiddlewareOptions {
  /** Maximum file size in bytes (default: 25MB) */
  maxFileSize?: number;
  /** Maximum number of files allowed (default: 10) */
  maxFiles?: number;
  /** Allowed MIME types (e.g. ['image/jpeg', 'image/png']) */
  allowedMimeTypes?: string[];
  /** Specific form field name (if omitted, accepts any field name via upload.any()) */
  fieldName?: string;
}

const DEFAULT_MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const DEFAULT_MAX_FILES = 10;

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)}KB`;
  }
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

/**
 * Creates a reusable Multer memory-storage upload middleware
 * with built-in error handling and size/type validation.
 */
export function createUploadMiddleware(options: UploadMiddlewareOptions = {}) {
  const maxFileSize = options.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;
  const maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES;
  const allowedMimeTypes = options.allowedMimeTypes;

  const storage = multer.memoryStorage();

  const upload = multer({
    storage,
    limits: {
      fileSize: maxFileSize,
      files: maxFiles,
    },
    fileFilter: (_req, file, cb) => {
      if (allowedMimeTypes && allowedMimeTypes.length > 0) {
        if (!allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
          return cb(
            new AppError(
              `Unsupported file type '${file.mimetype}'. Allowed types: ${allowedMimeTypes.join(", ")}`,
              400,
            ),
          );
        }
      }
      cb(null, true);
    },
  });

  const handler = options.fieldName
    ? upload.array(options.fieldName, maxFiles)
    : upload.any();

  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return next(
              new AppError(
                `File size exceeds maximum allowed limit of ${formatBytes(maxFileSize)}`,
                400,
              ),
            );
          }
          if (err.code === "LIMIT_FILE_COUNT") {
            return next(
              new AppError(
                `Maximum ${maxFiles} file${maxFiles > 1 ? "s" : ""} can be uploaded at once`,
                400,
              ),
            );
          }
          if (err.code === "LIMIT_UNEXPECTED_FILE") {
            return next(
              new AppError(
                `Unexpected field for file upload: ${err.field || "unknown"}`,
                400,
              ),
            );
          }
          return next(new AppError(`Upload error: ${err.message}`, 400));
        }

        if (err instanceof AppError) {
          return next(err);
        }

        return next(
          new AppError(err.message || "Failed to process file upload", 400),
        );
      }

      next();
    });
  };
}

/**
 * Standard upload middleware (25MB limit, up to 10 files, accepts any field name)
 */
export const uploadMiddleware = createUploadMiddleware();

/**
 * Mail attachment upload middleware (25MB email standard, up to 10 files)
 */
export const mailAttachmentUpload = createUploadMiddleware({
  maxFileSize: 25 * 1024 * 1024,
  maxFiles: 10,
});

/**
 * Image-only upload middleware (e.g. for profile avatars, up to 5MB, single image)
 */
export const imageUploadMiddleware = createUploadMiddleware({
  maxFileSize: 5 * 1024 * 1024,
  maxFiles: 1,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
});

export default createUploadMiddleware;
