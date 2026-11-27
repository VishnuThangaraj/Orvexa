import crypto from "node:crypto";
import path from "node:path";
import { PassThrough, Readable, Transform } from "node:stream";
import type { UploadApiErrorResponse, UploadApiResponse } from "cloudinary";
import AppError from "../../common/errors/AppError.js";
import cloudinary, { isCloudinaryConfigured } from "../../config/cloudinary.js";
import {
  deleteFromCloudinary,
  uploadBufferToCloudinary,
} from "../cloudinary/cloudinary.service.js";
import type {
  IStorageProvider,
  StorageGetOptions,
  StorageGetResult,
  StoragePutOptions,
  StoragePutResult,
  StorageStats,
} from "./storage.types.js";

export interface CloudAssetDescriptor {
  publicId: string;
  resourceType?: string | null;
  deliveryType?: string | null;
  version?: number | null;
  format?: string | null;
  mimeType?: string | null;
  bytes?: bigint | number | null;
  secureUrl?: string | null;
  storageBackend?: string | null;
  storagePath?: string | null;
}

type CloudResType = "image" | "video" | "raw";
type CloudDelType = "upload" | "authenticated" | "private";

export function toCloudinaryResourceType(
  value?: string | null,
  mimeType?: string | null,
): CloudResType {
  const normalized = value?.toUpperCase();
  if (normalized === "IMAGE") return "image";
  if (normalized === "VIDEO") return "video";
  if (normalized === "RAW") return "raw";

  const mime = (mimeType || "").toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "raw";
}

export function toCloudinaryDeliveryType(value?: string | null): CloudDelType {
  const normalized = value?.toUpperCase();
  if (normalized === "UPLOAD") return "upload";
  if (normalized === "PRIVATE") return "private";
  return "authenticated";
}

function fromCloudinaryResourceType(resType?: string): "IMAGE" | "VIDEO" | "RAW" {
  if (resType === "image") return "IMAGE";
  if (resType === "video") return "VIDEO";
  return "RAW";
}

function fromCloudinaryDeliveryType(type?: string): "UPLOAD" | "AUTHENTICATED" | "PRIVATE" {
  const upper = type?.toUpperCase();
  if (upper === "UPLOAD") return "UPLOAD";
  if (upper === "PRIVATE") return "PRIVATE";
  return "AUTHENTICATED";
}

function getChunkPublicId(chunkSessionId: string, chunkIndex: number): string {
  return `orvexa_drive_chunk_${chunkSessionId}_${String(chunkIndex).padStart(6, "0")}.part`;
}

function getChunkPrefix(chunkSessionId: string): string {
  return `orvexa_drive_chunk_${chunkSessionId}_`;
}

function createByteSliceStream(start: number, end: number): Transform {
  let offset = 0;
  return new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      const chunkStart = offset;
      const chunkEnd = offset + chunk.length - 1;
      offset += chunk.length;

      if (chunkEnd < start || chunkStart > end) {
        callback();
        return;
      }

      const sliceStart = Math.max(0, start - chunkStart);
      const sliceEnd = Math.min(chunk.length, end - chunkStart + 1);
      callback(null, chunk.subarray(sliceStart, sliceEnd));
    },
  });
}

function mapUploadResult(
  fallbackKey: string,
  result: UploadApiResponse,
  sha256: string,
  mimeType?: string,
): StoragePutResult {
  return {
    key: result.public_id || fallbackKey,
    size: result.bytes,
    sha256,
    mimeType,
    storageBackend: "CLOUDINARY",
    publicId: result.public_id,
    cloudinaryAssetId: result.asset_id ?? null,
    resourceType: fromCloudinaryResourceType(result.resource_type),
    deliveryType: fromCloudinaryDeliveryType(result.type),
    version: result.version ?? null,
    format: result.format ?? null,
    secureUrl: result.secure_url ?? null,
    width: result.width ?? null,
    height: result.height ?? null,
  };
}

export class CloudinaryStorageProvider implements IStorageProvider {
  private assertConfigured(): void {
    if (!isCloudinaryConfigured) {
      throw new AppError("Cloudinary is not configured", 500);
    }
  }

  private buildAssetUrl(asset: CloudAssetDescriptor): string {
    if (asset.secureUrl && asset.deliveryType?.toUpperCase() === "UPLOAD") {
      return asset.secureUrl;
    }

    this.assertConfigured();
    const resourceType = toCloudinaryResourceType(asset.resourceType, asset.mimeType);
    const deliveryType = toCloudinaryDeliveryType(asset.deliveryType);

    if (asset.secureUrl && deliveryType === "authenticated") {
      // Signed URL for authenticated/private Cloudinary assets
      return cloudinary.url(asset.publicId, {
        resource_type: resourceType,
        type: deliveryType,
        version: asset.version ?? undefined,
        format: resourceType !== "raw" ? (asset.format ?? undefined) : undefined,
        sign_url: true,
        secure: true,
      });
    }

    return (
      asset.secureUrl ||
      cloudinary.url(asset.publicId, {
        resource_type: resourceType,
        type: deliveryType,
        version: asset.version ?? undefined,
        format: resourceType !== "raw" ? (asset.format ?? undefined) : undefined,
        sign_url: deliveryType !== "upload",
        secure: true,
      })
    );
  }

  async putStream(
    key: string,
    stream: Readable,
    options: StoragePutOptions = {},
  ): Promise<StoragePutResult> {
    this.assertConfigured();
    const resourceType = toCloudinaryResourceType(undefined, options.mimeType);
    const filename = options.filename || path.basename(key);

    const hash = crypto.createHash("sha256");
    let size = 0;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "orvexa/drive",
          resource_type: resourceType,
          filename_override: filename,
        },
        (error?: UploadApiErrorResponse, result?: UploadApiResponse) => {
          if (error || !result) {
            return reject(
              new AppError(
                error?.message || "Failed to upload file stream to Cloudinary",
                502,
              ),
            );
          }
          resolve(mapUploadResult(key, result, hash.digest("hex"), options.mimeType));
        },
      );

      stream.on("data", (chunk: Buffer) => {
        hash.update(chunk);
        size += chunk.length;
      });

      stream.on("error", (err) => {
        uploadStream.destroy(err);
        reject(err);
      });

      stream.pipe(uploadStream);
    });
  }

  async putBuffer(
    key: string,
    buffer: Buffer,
    options: StoragePutOptions = {},
  ): Promise<StoragePutResult> {
    this.assertConfigured();
    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");

    if (buffer.length === 0) {
      return {
        key,
        size: 0,
        sha256,
        mimeType: options.mimeType,
        storageBackend: "CLOUDINARY",
        publicId: key,
        cloudinaryAssetId: null,
        resourceType: "RAW",
        deliveryType: "UPLOAD",
        version: null,
        format: null,
        secureUrl: null,
        width: null,
        height: null,
      };
    }

    const resourceType = toCloudinaryResourceType(undefined, options.mimeType);
    const filename = options.filename || path.basename(key);

    try {
      const result = await uploadBufferToCloudinary(buffer, {
        folder: "orvexa/drive",
        resource_type: resourceType,
        filename_override: filename,
      });
      return mapUploadResult(key, result, sha256, options.mimeType);
    } catch (err: any) {
      // Fallback to raw if Cloudinary rejects an exotic/corrupted image under image resource_type
      if (resourceType === "image") {
        const result = await uploadBufferToCloudinary(buffer, {
          folder: "orvexa/drive",
          resource_type: "raw",
          filename_override: filename,
        });
        return mapUploadResult(key, result, sha256, options.mimeType);
      }
      throw err;
    }
  }

  async getAssetStream(
    asset: CloudAssetDescriptor,
    options: StorageGetOptions = {},
  ): Promise<StorageGetResult> {
    const totalLength = asset.bytes !== null && asset.bytes !== undefined ? Number(asset.bytes) : 0;

    if (totalLength === 0 && !asset.secureUrl) {
      return {
        stream: Readable.from([]),
        contentLength: 0,
        totalLength: 0,
        mimeType: asset.mimeType ?? undefined,
      };
    }

    const url = this.buildAssetUrl(asset);

    let start = options.start;
    let end = options.end;

    const headers: Record<string, string> = {};
    if (start !== undefined || end !== undefined) {
      if (start !== undefined && end === undefined && totalLength > 0) {
        end = totalLength - 1;
      } else if (start === undefined && end !== undefined && totalLength > 0) {
        start = Math.max(0, totalLength - end);
        end = totalLength - 1;
      }

      if (start !== undefined && end !== undefined) {
        if (totalLength > 0 && (start < 0 || end >= totalLength || start > end)) {
          throw new AppError("Requested range not satisfiable", 416);
        }
        headers.Range = `bytes=${start}-${end}`;
      } else if (start !== undefined) {
        headers.Range = `bytes=${start}-`;
      }
    }

    const response = await fetch(url, { headers });
    if (!response.ok && response.status !== 206) {
      throw new AppError(
        response.status === 404 ? "File not found in cloud storage" : "Failed to fetch file from cloud storage",
        response.status === 404 ? 404 : 502,
      );
    }

    if (!response.body) {
      throw new AppError("Empty response stream from cloud storage", 502);
    }

    let nodeStream: Readable = Readable.fromWeb(
      response.body as import("node:stream/web").ReadableStream,
    );

    const headerLength = response.headers.get("content-length");
    const parsedLength = headerLength ? parseInt(headerLength, 10) : NaN;
    const resolvedTotal = totalLength || (Number.isFinite(parsedLength) ? parsedLength : 0);

    if (start !== undefined && end !== undefined) {
      const expectedRangeLength = end - start + 1;
      if (response.status === 200) {
        // Upstream ignored Range header; slice stream locally
        const sliced = nodeStream.pipe(createByteSliceStream(start, end));
        nodeStream = sliced;
      }
      return {
        stream: nodeStream,
        contentLength: expectedRangeLength,
        totalLength: resolvedTotal,
        mimeType: asset.mimeType ?? response.headers.get("content-type") ?? undefined,
      };
    }

    return {
      stream: nodeStream,
      contentLength: Number.isFinite(parsedLength) ? parsedLength : resolvedTotal,
      totalLength: resolvedTotal,
      mimeType: asset.mimeType ?? response.headers.get("content-type") ?? undefined,
    };
  }

  async getAssetBuffer(asset: CloudAssetDescriptor): Promise<Buffer> {
    const { stream } = await this.getAssetStream(asset);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  async getThumbnailBuffer(
    asset: CloudAssetDescriptor,
    width: number,
    height: number,
  ): Promise<{ buffer: Buffer; mimeType: string } | null> {
    if (toCloudinaryResourceType(asset.resourceType, asset.mimeType) !== "image") {
      return null;
    }

    try {
      this.assertConfigured();
      const deliveryType = toCloudinaryDeliveryType(asset.deliveryType);
      const url = cloudinary.url(asset.publicId, {
        resource_type: "image",
        type: deliveryType,
        version: asset.version ?? undefined,
        width,
        height,
        crop: "fill",
        format: "webp",
        quality: 80,
        sign_url: deliveryType !== "upload",
        secure: true,
      });

      const response = await fetch(url);
      if (!response.ok) {
        return null;
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length === 0) return null;
      return { buffer, mimeType: "image/webp" };
    } catch {
      return null;
    }
  }

  async deleteAsset(asset: CloudAssetDescriptor): Promise<void> {
    if (!isCloudinaryConfigured || !asset.publicId) return;
    if ((asset.bytes === 0 || asset.bytes === 0n) && !asset.secureUrl) return;

    const resourceType = toCloudinaryResourceType(asset.resourceType, asset.mimeType);
    const deliveryType = toCloudinaryDeliveryType(asset.deliveryType);
    await deleteFromCloudinary(asset.publicId, resourceType, deliveryType);
  }

  async getStream(key: string, options: StorageGetOptions = {}): Promise<StorageGetResult> {
    return this.getAssetStream(
      {
        publicId: key,
        deliveryType: "UPLOAD",
        resourceType: "RAW",
      },
      options,
    );
  }

  async getBuffer(key: string): Promise<Buffer> {
    return this.getAssetBuffer({
      publicId: key,
      deliveryType: "UPLOAD",
      resourceType: "RAW",
    });
  }

  async delete(key: string): Promise<void> {
    if (!isCloudinaryConfigured) return;
    for (const resType of ["raw", "image", "video"] as const) {
      try {
        const res = await cloudinary.uploader.destroy(key, { resource_type: resType });
        if (res?.result === "ok") return;
      } catch {
        // try next resource type
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!isCloudinaryConfigured) return false;
    for (const resType of ["raw", "image", "video"] as const) {
      try {
        await cloudinary.api.resource(key, { resource_type: resType });
        return true;
      } catch {
        // try next resource type
      }
    }
    return false;
  }

  async getStats(key: string): Promise<StorageStats> {
    this.assertConfigured();
    for (const resType of ["raw", "image", "video"] as const) {
      try {
        const res = await cloudinary.api.resource(key, { resource_type: resType });
        return {
          size: Number(res.bytes || 0),
          lastModified: res.created_at ? new Date(res.created_at) : new Date(),
        };
      } catch {
        // try next resource type
      }
    }
    throw new AppError("File not found in cloud storage", 404);
  }

  async saveChunk(
    chunkSessionId: string,
    chunkIndex: number,
    buffer: Buffer,
  ): Promise<void> {
    this.assertConfigured();
    if (buffer.length === 0) return;

    const publicId = getChunkPublicId(chunkSessionId, chunkIndex);
    await uploadBufferToCloudinary(buffer, {
      public_id: publicId,
      resource_type: "raw",
      type: "upload",
      overwrite: true,
    });
  }

  async stitchChunks(
    chunkSessionId: string,
    totalChunks: number,
    finalKey: string,
    options: StoragePutOptions = {},
  ): Promise<StoragePutResult> {
    this.assertConfigured();

    const resourceType = toCloudinaryResourceType(undefined, options.mimeType);
    const filename = options.filename || path.basename(finalKey);
    const hash = crypto.createHash("sha256");
    let totalBytes = 0;

    const passThrough = new PassThrough();

    const uploadPromise = new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "orvexa/drive",
          resource_type: resourceType,
          filename_override: filename,
        },
        (error?: UploadApiErrorResponse, result?: UploadApiResponse) => {
          if (error || !result) {
            return reject(
              new AppError(
                error?.message || "Failed to assemble chunked upload in Cloudinary",
                502,
              ),
            );
          }
          resolve(result);
        },
      );

      passThrough.on("error", (err) => {
        uploadStream.destroy(err);
        reject(err);
      });

      passThrough.pipe(uploadStream);
    });

    try {
      for (let i = 0; i < totalChunks; i++) {
        const chunkPublicId = getChunkPublicId(chunkSessionId, i);
        const chunkUrl = cloudinary.url(chunkPublicId, {
          resource_type: "raw",
          type: "upload",
          secure: true,
        });

        const response = await fetch(chunkUrl);
        if (!response.ok) {
          throw new AppError(`Missing chunk ${i} for session ${chunkSessionId}`, 400);
        }

        const chunkBuf = Buffer.from(await response.arrayBuffer());
        hash.update(chunkBuf);
        totalBytes += chunkBuf.length;

        const canWrite = passThrough.write(chunkBuf);
        if (!canWrite) {
          await new Promise<void>((resolve) => passThrough.once("drain", resolve));
        }
      }

      passThrough.end();
      const uploadResult = await uploadPromise;

      await this.cleanupChunks(chunkSessionId);

      return mapUploadResult(finalKey, uploadResult, hash.digest("hex"), options.mimeType);
    } catch (err) {
      passThrough.destroy();
      uploadPromise.catch(() => {});
      throw err;
    }
  }

  async cleanupChunks(chunkSessionId: string): Promise<void> {
    if (!isCloudinaryConfigured) return;
    try {
      await cloudinary.api.delete_resources_by_prefix(getChunkPrefix(chunkSessionId), {
        resource_type: "raw",
        type: "upload",
      });
    } catch {
      // Best-effort cleanup
    }
  }
}
