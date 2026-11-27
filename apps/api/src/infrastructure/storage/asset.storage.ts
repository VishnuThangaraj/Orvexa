import { Readable } from "node:stream";
import AppError from "../../common/errors/AppError.js";
import {
  CloudinaryStorageProvider,
  type CloudAssetDescriptor,
} from "./cloudinary.storage.js";
import { LocalStorageProvider } from "./local.storage.js";
import { getStorageProvider } from "./storage.factory.js";
import type { StorageGetOptions, StorageGetResult } from "./storage.types.js";

function getLocalProvider(): LocalStorageProvider {
  const active = getStorageProvider();
  return active instanceof LocalStorageProvider ? active : new LocalStorageProvider();
}

function getCloudinaryProvider(): CloudinaryStorageProvider {
  const active = getStorageProvider();
  return active instanceof CloudinaryStorageProvider
    ? active
    : new CloudinaryStorageProvider();
}

export function isCloudinaryAsset(asset: CloudAssetDescriptor): boolean {
  if (asset.storageBackend?.toUpperCase() === "CLOUDINARY") {
    return true;
  }
  if (!asset.storagePath && (asset.secureUrl || asset.publicId)) {
    return true;
  }
  return false;
}

export async function resolveAssetStream(
  asset: CloudAssetDescriptor,
  options: StorageGetOptions = {},
): Promise<StorageGetResult> {
  if ((asset.bytes === 0 || asset.bytes === 0n) && !asset.secureUrl && !asset.storagePath) {
    return {
      stream: Readable.from([]),
      contentLength: 0,
      totalLength: 0,
      mimeType: asset.mimeType ?? undefined,
    };
  }

  if (isCloudinaryAsset(asset)) {
    return getCloudinaryProvider().getAssetStream(asset, options);
  }

  if (!asset.storagePath) {
    throw new AppError("Storage path missing for asset", 500);
  }

  return getLocalProvider().getStream(asset.storagePath, options);
}

export async function resolveAssetBuffer(asset: CloudAssetDescriptor): Promise<Buffer> {
  if ((asset.bytes === 0 || asset.bytes === 0n) && !asset.secureUrl && !asset.storagePath) {
    return Buffer.alloc(0);
  }

  if (isCloudinaryAsset(asset)) {
    return getCloudinaryProvider().getAssetBuffer(asset);
  }

  if (!asset.storagePath) {
    throw new AppError("Storage path missing for asset", 500);
  }

  return getLocalProvider().getBuffer(asset.storagePath);
}

export async function resolveCloudThumbnailBuffer(
  asset: CloudAssetDescriptor,
  width: number,
  height: number,
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  if (!isCloudinaryAsset(asset)) {
    return null;
  }
  return getCloudinaryProvider().getThumbnailBuffer(asset, width, height);
}

export async function deleteAssetBlob(asset: CloudAssetDescriptor): Promise<void> {
  if (isCloudinaryAsset(asset)) {
    await getCloudinaryProvider().deleteAsset(asset);
    return;
  }
  if (asset.storagePath) {
    await getLocalProvider().delete(asset.storagePath);
  }
}
