import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import {
  CloudinaryStorageProvider,
} from "../../src/infrastructure/storage/cloudinary.storage.js";
import { LocalStorageProvider } from "../../src/infrastructure/storage/local.storage.js";
import {
  getStorageProvider,
  resetStorageProvider,
} from "../../src/infrastructure/storage/storage.factory.js";
import {
  isCloudinaryAsset,
  resolveAssetBuffer,
  resolveAssetStream,
} from "../../src/infrastructure/storage/asset.storage.js";
import { isCloudinaryConfigured } from "../../src/config/cloudinary.js";
import AppError from "../../src/common/errors/AppError.js";

describe("Cloudinary & Vercel Storage Provider Unit Tests", () => {
  const originalVercel = process.env.VERCEL;
  const originalBackend = process.env.STORAGE_BACKEND;
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    if (originalVercel === undefined) {
      delete process.env.VERCEL;
    } else {
      process.env.VERCEL = originalVercel;
    }
    if (originalBackend === undefined) {
      delete process.env.STORAGE_BACKEND;
    } else {
      process.env.STORAGE_BACKEND = originalBackend;
    }
    globalThis.fetch = originalFetch;
    resetStorageProvider();
  });

  it("should default LocalStorageProvider to os.tmpdir() when VERCEL is set", () => {
    process.env.VERCEL = "1";
    const local = new LocalStorageProvider();
    const expectedPrefix = path.join(os.tmpdir(), "orvexa-storage");
    // @ts-expect-error inspecting resolved baseDir for Vercel safety
    assert.ok(local.baseDir.startsWith(expectedPrefix));
  });

  it("should select CloudinaryStorageProvider automatically on Vercel when configured", () => {
    delete process.env.STORAGE_BACKEND;
    process.env.VERCEL = "1";
    resetStorageProvider();

    if (isCloudinaryConfigured) {
      const provider = getStorageProvider();
      assert.ok(provider instanceof CloudinaryStorageProvider);
    } else {
      assert.throws(
        () => getStorageProvider(),
        (err: unknown) => err instanceof AppError && err.statusCode === 500,
      );
    }
  });

  it("should select LocalStorageProvider locally when STORAGE_BACKEND is unset", () => {
    delete process.env.STORAGE_BACKEND;
    delete process.env.VERCEL;
    resetStorageProvider();

    const provider = getStorageProvider();
    assert.ok(provider instanceof LocalStorageProvider);
  });

  it("should identify Cloudinary vs Local FileAssets accurately", () => {
    assert.equal(
      isCloudinaryAsset({
        publicId: "orvexa/drive/abc",
        storageBackend: "CLOUDINARY",
        storagePath: "orvexa/drive/abc",
      }),
      true,
    );

    assert.equal(
      isCloudinaryAsset({
        publicId: "orvexa/mail/attachments/xyz",
        storageBackend: "CLOUDINARY",
        storagePath: null,
        secureUrl: "https://res.cloudinary.com/demo/raw/upload/xyz",
      }),
      true,
    );

    assert.equal(
      isCloudinaryAsset({
        publicId: "drive/1/file.txt",
        storageBackend: "LOCAL",
        storagePath: "drive/1/file.txt",
      }),
      false,
    );
  });

  it("should handle 0-byte buffers in CloudinaryStorageProvider without failing", async () => {
    const provider = new CloudinaryStorageProvider();
    if (!isCloudinaryConfigured) {
      // Skip if test environment has no Cloudinary credentials
      return;
    }

    const res = await provider.putBuffer("drive/1/empty.txt", Buffer.alloc(0), {
      mimeType: "text/plain",
      filename: "empty.txt",
    });
    assert.equal(res.size, 0);
    assert.equal(res.storageBackend, "CLOUDINARY");

    const buf = await resolveAssetBuffer({
      publicId: res.publicId!,
      storageBackend: "CLOUDINARY",
      bytes: 0n,
      secureUrl: null,
      storagePath: null,
      mimeType: "text/plain",
    });
    assert.equal(buf.length, 0);
  });

  it("should stream Cloudinary assets and slice byte ranges when upstream returns 200", async () => {
    const payload = Buffer.from("0123456789ABCDEF");
    globalThis.fetch = (async () =>
      new Response(payload, {
        status: 200,
        headers: { "content-length": String(payload.length) },
      })) as typeof fetch;

    const rangeRes = await resolveAssetStream(
      {
        publicId: "orvexa/drive/sample",
        storageBackend: "CLOUDINARY",
        deliveryType: "UPLOAD",
        resourceType: "RAW",
        secureUrl: "https://res.cloudinary.com/demo/raw/upload/v1/sample.bin",
        bytes: BigInt(payload.length),
        mimeType: "application/octet-stream",
      },
      { start: 4, end: 9 },
    );

    assert.equal(rangeRes.contentLength, 6);
    assert.equal(rangeRes.totalLength, 16);

    const chunks: Buffer[] = [];
    for await (const chunk of rangeRes.stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    assert.equal(Buffer.concat(chunks).toString("utf-8"), "456789");
  });
});
