import type { UploadApiErrorResponse, UploadApiResponse } from "cloudinary";
import cloudinary from "../../config/cloudinary.js";

export interface CloudinaryUploadOptions {
  folder?: string;
  resource_type?: "auto" | "image" | "video" | "raw";
  filename_override?: string;
  public_id?: string;
}

/**
 * Upload an in-memory file buffer directly to Cloudinary via stream.
 */
export const uploadBufferToCloudinary = (
  buffer: Buffer,
  options: CloudinaryUploadOptions = {},
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || "orvexa/general",
        resource_type: options.resource_type || "auto",
        filename_override: options.filename_override,
        public_id: options.public_id,
      },
      (error?: UploadApiErrorResponse, result?: UploadApiResponse) => {
        if (error || !result) {
          return reject(error || new Error("Cloudinary upload failed"));
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
): Promise<void> => {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

export default {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
};
