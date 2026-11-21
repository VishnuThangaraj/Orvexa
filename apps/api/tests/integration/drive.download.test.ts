import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { PassThrough, Writable } from "node:stream";
import prisma from "../../src/infrastructure/database/prisma.js";
import { driveService } from "../../src/modules/drive/drive.service.js";
import sharp from "sharp";
import AppError from "../../src/common/errors/AppError.js";

describe("Task 2.3: Streamed Downloads, Byte-Range Streaming, Thumbnails & ZIP Integration Tests", () => {
  let owner: any;
  let viewer: any;
  let sampleFile: any;
  let sampleImage: any;
  let sampleFolder: any;

  before(async () => {
    const unique = Date.now();
    owner = await prisma.user.create({
      data: {
        fullName: "Drive Download Owner",
        username: `down_owner_${unique}`,
        email: `down_owner_${unique}@test.com`,
      },
    });

    viewer = await prisma.user.create({
      data: {
        fullName: "Drive Download Viewer",
        username: `down_viewer_${unique}`,
        email: `down_viewer_${unique}@test.com`,
      },
    });

    // 1. Upload sample text file
    const textData = Buffer.from("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    const [uploadedFile] = await driveService.uploadFiles(owner.id, [
      {
        originalname: "alphabet.txt",
        buffer: textData,
        mimetype: "text/plain",
        size: textData.length,
      },
    ]);
    sampleFile = uploadedFile;

    // 2. Generate and upload a real sample 100x100 PNG image using sharp
    const pngBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 66, g: 133, b: 244, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const [uploadedImage] = await driveService.uploadFiles(owner.id, [
      {
        originalname: "avatar.png",
        buffer: pngBuffer,
        mimetype: "image/png",
        size: pngBuffer.length,
      },
    ]);
    sampleImage = uploadedImage;

    // 3. Create folder with nested file
    sampleFolder = await driveService.createFolder(owner.id, {
      name: "ZipFolder",
    });

    await driveService.uploadFiles(
      owner.id,
      [
        {
          originalname: "nested.txt",
          buffer: Buffer.from("Nested file inside ZipFolder"),
          mimetype: "text/plain",
          size: 29,
        },
      ],
      sampleFolder.id,
    );
  });

  after(async () => {
    await prisma.driveActivity.deleteMany();
    await prisma.drivePermission.deleteMany();
    await prisma.driveFile.deleteMany();
    await prisma.driveFolder.deleteMany();
    await prisma.fileAsset.deleteMany({
      where: { uploadedBy: { in: [owner.id, viewer.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [owner.id, viewer.id] } },
    });
  });

  it("should stream a single file download with correct metadata and full content", async () => {
    const res = await driveService.getFileDownloadStream(owner.id, BigInt(sampleFile.id));
    assert.strictEqual(res.filename, "alphabet.txt");
    assert.strictEqual(res.mimeType, "text/plain");
    assert.strictEqual(res.size, 36);

    const chunks: Buffer[] = [];
    for await (const chunk of res.stream) {
      chunks.push(Buffer.from(chunk));
    }
    const full = Buffer.concat(chunks);
    assert.strictEqual(full.toString("utf-8"), "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  });

  it("should enforce preventDownload restriction for viewers but allow owner/editors", async () => {
    // 1. Enable preventDownload on file
    await driveService.updateFile(owner.id, BigInt(sampleFile.id), {
      preventDownload: true,
    });

    // 2. Share file with viewer as VIEWER
    await prisma.drivePermission.create({
      data: {
        fileId: BigInt(sampleFile.id),
        userId: viewer.id,
        grantedBy: owner.id,
        accessLevel: "VIEWER",
      },
    });

    // 3. Viewer attempting to download should be rejected with 403
    await assert.rejects(
      async () => {
        await driveService.getFileDownloadStream(viewer.id, BigInt(sampleFile.id));
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 403);
        assert.match(err.message, /Download disabled/);
        return true;
      },
    );

    // 4. Owner can still download freely
    const ownerStream = await driveService.getFileDownloadStream(owner.id, BigInt(sampleFile.id));
    assert.ok(ownerStream.stream);

    // Reset preventDownload
    await driveService.updateFile(owner.id, BigInt(sampleFile.id), {
      preventDownload: false,
    });
  });

  it("should support HTTP 206 Partial Content byte-range streaming", async () => {
    // Request bytes 0 to 9 (10 bytes: '0123456789')
    const rangeRes = await driveService.getFileStreamForPreview(
      owner.id,
      BigInt(sampleFile.id),
      { range: "bytes=0-9" },
    );

    assert.strictEqual(rangeRes.status, 206);
    assert.strictEqual(rangeRes.contentRange, "bytes 0-9/36");
    assert.strictEqual(rangeRes.contentLength, 10);

    const chunks: Buffer[] = [];
    for await (const chunk of rangeRes.stream) {
      chunks.push(Buffer.from(chunk));
    }
    const result = Buffer.concat(chunks);
    assert.strictEqual(result.toString("utf-8"), "0123456789");
  });

  it("should generate webp thumbnail for images and return null for non-images", async () => {
    // 1. Image thumbnail
    const thumb = await driveService.getFileThumbnail(owner.id, BigInt(sampleImage.id), {
      width: 50,
      height: 50,
    });
    assert.ok(thumb);
    assert.strictEqual(thumb.mimeType, "image/webp");
    assert.ok(thumb.buffer.length > 0);

    // Verify sharp metadata of generated thumbnail
    const meta = await sharp(thumb.buffer).metadata();
    assert.strictEqual(meta.format, "webp");
    assert.strictEqual(meta.width, 50);
    assert.strictEqual(meta.height, 50);

    // 2. Non-image file (text file)
    const textThumb = await driveService.getFileThumbnail(owner.id, BigInt(sampleFile.id));
    assert.strictEqual(textThumb, null);
  });

  it("should stream multi-item ZIP archive directly to response stream", async () => {
    const chunks: Buffer[] = [];
    const mockRes: any = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(Buffer.from(chunk));
        callback();
      },
    });

    mockRes.headers = {};
    mockRes.setHeader = (key: string, val: string) => {
      mockRes.headers[key] = val;
    };

    await driveService.streamZipDownload(
      owner.id,
      [
        { id: sampleFile.id, type: "file" },
        { id: sampleFolder.id, type: "folder" },
      ],
      mockRes,
    );

    // Verify zip headers
    assert.strictEqual(mockRes.headers["Content-Type"], "application/zip");
    assert.match(mockRes.headers["Content-Disposition"], /drive_download_/);

    // Verify non-empty zip output
    const zipBuffer = Buffer.concat(chunks);
    assert.ok(zipBuffer.length > 100);

    // Verify ZIP magic signature (PK\x03\x04 or PK\x05\x06)
    assert.strictEqual(zipBuffer[0], 0x50); // 'P'
    assert.strictEqual(zipBuffer[1], 0x4b); // 'K'
  });
});
