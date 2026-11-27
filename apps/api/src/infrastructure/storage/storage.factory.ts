import AppError from "../../common/errors/AppError.js";
import { isCloudinaryConfigured } from "../../config/cloudinary.js";
import type { IStorageProvider } from "./storage.types.js";
import { LocalStorageProvider } from "./local.storage.js";
import { CloudinaryStorageProvider } from "./cloudinary.storage.js";

let storageInstance: IStorageProvider | null = null;

export function resetStorageProvider(): void {
  storageInstance = null;
}

export function getStorageProvider(): IStorageProvider {
  if (!storageInstance) {
    const explicitBackend = process.env.STORAGE_BACKEND?.trim().toLowerCase();

    if (explicitBackend === "cloudinary") {
      if (!isCloudinaryConfigured) {
        throw new AppError(
          "STORAGE_BACKEND is set to cloudinary, but Cloudinary credentials are missing",
          500,
        );
      }
      storageInstance = new CloudinaryStorageProvider();
    } else if (explicitBackend === "local") {
      storageInstance = new LocalStorageProvider();
    } else if (process.env.VERCEL) {
      if (!isCloudinaryConfigured) {
        throw new AppError(
          "Cloudinary is not configured for Drive storage on Vercel",
          500,
        );
      }
      storageInstance = new CloudinaryStorageProvider();
    } else {
      storageInstance = new LocalStorageProvider();
    }
  }
  return storageInstance;
}

export default getStorageProvider;
