import type { UploadApiErrorResponse, UploadApiResponse } from "cloudinary";
import AppError from "../../common/errors/AppError.js";
import cloudinary, {
  isCloudinaryConfigured,
} from "../../config/cloudinary.js";

export interface CloudinaryUploadOptions {
  folder?: string;
  resource_type?: "auto" | "image" | "video" | "raw";
  filename_override?: string;
  public_id?: string;
  overwrite?: boolean;
  type?: "upload" | "authenticated" | "private";
}

/**
 * Upload an in-memory file buffer directly to Cloudinary via stream.
 */
export const uploadBufferToCloudinary = (
  buffer: Buffer,
  options: CloudinaryUploadOptions = {},
): Promise<UploadApiResponse> => {
  if (!isCloudinaryConfigured) {
    return Promise.reject(new AppError("Cloudinary is not configured", 500));
  }

  return new Promise((resolve, reject) => {
    const uploadOptions: Record<string, unknown> = {
      resource_type: options.resource_type || "auto",
      filename_override: options.filename_override,
      public_id: options.public_id,
      overwrite: options.overwrite,
      type: options.type,
    };

    if (options.folder !== undefined) {
      uploadOptions.folder = options.folder;
    } else if (!options.public_id) {
      uploadOptions.folder = "orvexa/general";
    }

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error?: UploadApiErrorResponse, result?: UploadApiResponse) => {
        if (error || !result) {
          return reject(
            error instanceof Error
              ? error
              : new Error(error?.message || "Cloudinary upload failed"),
          );
        }
        resolve(result);
      },
    );
    stream.end(buffer);
  });
};

/**
 * Delete an asset from Cloudinary by public ID.
 */
export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: "image" | "video" | "raw" = "raw",
  deliveryType: "upload" | "authenticated" | "private" = "upload",
): Promise<void> => {
  if (!isCloudinaryConfigured) {
    throw new AppError("Cloudinary is not configured", 500);
  }
  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    type: deliveryType,
  });
};

export default {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
};
