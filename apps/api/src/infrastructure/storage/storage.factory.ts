import type { IStorageProvider } from "./storage.types.js";
import { LocalStorageProvider } from "./local.storage.js";

let storageInstance: IStorageProvider | null = null;

export function getStorageProvider(): IStorageProvider {
  if (!storageInstance) {
    const backend = (process.env.STORAGE_BACKEND || "local").toLowerCase();
    if (backend === "local") {
      storageInstance = new LocalStorageProvider();
    } else {
      // Fallback or extensible for S3
      storageInstance = new LocalStorageProvider();
    }
  }
  return storageInstance;
}

export default getStorageProvider;
