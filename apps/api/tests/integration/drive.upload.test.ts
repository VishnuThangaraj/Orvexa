import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../../src/infrastructure/database/prisma.js";
import { driveService } from "../../src/modules/drive/drive.service.js";
import { getStorageProvider } from "../../src/infrastructure/storage/index.js";
import AppError from "../../src/common/errors/AppError.js";

describe("Task 2.2: Chunked / Resumable Uploads & Folder Upload Preservation Integration Tests", () => {
  let user: any;
  const storage = getStorageProvider();

  before(async () => {
    const unique = Date.now();
    user = await prisma.user.create({
      data: {
        fullName: "Drive Upload User",
        username: `upload_user_${unique}`,
        email: `upload_${unique}@test.com`,
      },
    });
  });

  after(async () => {
    await prisma.driveActivity.deleteMany();
    await prisma.driveFileVersion.deleteMany();
    await prisma.driveFile.deleteMany();
    await prisma.driveFolder.deleteMany();
    await prisma.driveUploadSession.deleteMany();
    await prisma.fileAsset.deleteMany({ where: { uploadedBy: user.id } });
    await prisma.user.deleteMany({ where: { id: user.id } });
  });

  it("should upload a single file with real storage persistence and metadata extraction", async () => {
    const content = Buffer.from("Hello Orvexa Drive single file upload test!");
    const [uploaded] = await driveService.uploadFiles(user.id, [
      {
        originalname: "hello.txt",
        buffer: content,
        mimetype: "text/plain",
        size: content.length,
      },
    ]);

    assert.ok(uploaded);
    assert.strictEqual(uploaded.name, "hello.txt");
    assert.strictEqual(uploaded.currentVersion, 1);
    assert.strictEqual(uploaded.asset.mimeType, "text/plain");

    // Verify database record
    const dbFile = await prisma.driveFile.findUnique({
      where: { id: BigInt(uploaded.id) },
      include: { currentAsset: true },
    });
    assert.ok(dbFile);
    assert.strictEqual(dbFile.name, "hello.txt");
    assert.strictEqual(dbFile.currentAsset.storageBackend, "LOCAL");
    assert.strictEqual(dbFile.searchableContent, content.toString("utf-8"));

    // Verify blob in storage
    const exists = await storage.exists(dbFile.currentAsset.storagePath!);
    assert.strictEqual(exists, true);
    const readBuffer = await storage.getBuffer(dbFile.currentAsset.storagePath!);
    assert.deepStrictEqual(readBuffer, content);
  });

  it("should automatically resolve duplicate filename collisions on upload", async () => {
    const buffer1 = Buffer.from("First version of report");
    const buffer2 = Buffer.from("Second independent report with same name");

    const [file1] = await driveService.uploadFiles(user.id, [
      { originalname: "report.pdf", buffer: buffer1, mimetype: "application/pdf", size: buffer1.length },
    ]);
    const [file2] = await driveService.uploadFiles(user.id, [
      { originalname: "report.pdf", buffer: buffer2, mimetype: "application/pdf", size: buffer2.length },
    ]);

    assert.strictEqual(file1.name, "report.pdf");
    assert.strictEqual(file2.name, "report (1).pdf");
  });

  it("should preserve folder directory structure on multi-file folder upload", async () => {
    const bufferA = Buffer.from("Root readme content");
    const bufferB = Buffer.from("Architecture docs");
    const bufferC = Buffer.from("Sub-nested spec file");

    const uploaded = await driveService.uploadFiles(user.id, [
      {
        originalname: "README.md",
        buffer: bufferA,
        mimetype: "text/markdown",
        size: bufferA.length,
        relativePath: "ProjectA/README.md",
      },
      {
        originalname: "architecture.txt",
        buffer: bufferB,
        mimetype: "text/plain",
        size: bufferB.length,
        relativePath: "ProjectA/docs/architecture.txt",
      },
      {
        originalname: "spec.json",
        buffer: bufferC,
        mimetype: "application/json",
        size: bufferC.length,
        relativePath: "ProjectA/docs/v1/spec.json",
      },
    ]);

    assert.strictEqual(uploaded.length, 3);

    // Verify ProjectA folder was created
    const projectFolder = await prisma.driveFolder.findFirst({
      where: { ownerId: user.id, name: "ProjectA", parentFolderId: null },
    });
    assert.ok(projectFolder);

    // Verify ProjectA/docs subfolder
    const docsFolder = await prisma.driveFolder.findFirst({
      where: { ownerId: user.id, name: "docs", parentFolderId: projectFolder.id },
    });
    assert.ok(docsFolder);

    // Verify ProjectA/docs/v1 subfolder
    const v1Folder = await prisma.driveFolder.findFirst({
      where: { ownerId: user.id, name: "v1", parentFolderId: docsFolder.id },
    });
    assert.ok(v1Folder);

    // Verify README.md is directly under ProjectA
    assert.strictEqual(uploaded[0].folderId, String(projectFolder.id));
    // Verify architecture.txt is under docs
    assert.strictEqual(uploaded[1].folderId, String(docsFolder.id));
    // Verify spec.json is under v1
    assert.strictEqual(uploaded[2].folderId, String(v1Folder.id));
  });

  it("should perform full resumable chunked upload, stitch file, and complete session", async () => {
    const chunk1 = Buffer.alloc(50, "a");
    const chunk2 = Buffer.alloc(50, "b");
    const chunk3 = Buffer.alloc(50, "c");
    const fullBuffer = Buffer.concat([chunk1, chunk2, chunk3]);

    // 1. Init upload session
    const session = await driveService.initUploadSession(user.id, {
      filename: "large-video.mp4",
      mimeType: "video/mp4",
      totalBytes: BigInt(fullBuffer.length),
      chunkSize: 50,
    });

    assert.ok(session.sessionId);
    assert.strictEqual(session.totalChunks, 3);

    // 2. Upload chunks
    const c0 = await driveService.uploadChunk(user.id, session.sessionId, 0, chunk1);
    assert.strictEqual(c0.completedChunks, 1);

    const c1 = await driveService.uploadChunk(user.id, session.sessionId, 1, chunk2);
    assert.strictEqual(c1.completedChunks, 2);

    const c2 = await driveService.uploadChunk(user.id, session.sessionId, 2, chunk3);
    assert.strictEqual(c2.completedChunks, 3);

    // 3. Complete session
    const completed = await driveService.completeUploadSession(user.id, session.sessionId);
    assert.strictEqual(completed.name, "large-video.mp4");
    assert.strictEqual(completed.currentVersion, 1);
    assert.strictEqual(completed.asset.bytes, String(fullBuffer.length));

    // Verify stitched file in storage
    const asset = await prisma.fileAsset.findUnique({
      where: { id: BigInt(completed.asset.id) },
    });
    assert.ok(asset);
    const readFull = await storage.getBuffer(asset.storagePath!);
    assert.deepStrictEqual(readFull, fullBuffer);

    // Verify session marked completed
    const sessionDb = await prisma.driveUploadSession.findUnique({
      where: { id: session.sessionId },
    });
    assert.strictEqual(sessionDb?.status, "COMPLETED");
  });

  it("should upload a new version of an existing file via chunked upload", async () => {
    // 1. Initial file
    const v1Content = Buffer.from("Initial content v1");
    const [file] = await driveService.uploadFiles(user.id, [
      { originalname: "notes.txt", buffer: v1Content, mimetype: "text/plain", size: v1Content.length },
    ]);
    const fileId = BigInt(file.id);

    // 2. Resumable session targeting existing file
    const v2Content = Buffer.from("Updated new content for version 2");
    const session = await driveService.initUploadSession(user.id, {
      filename: "notes.txt",
      mimeType: "text/plain",
      totalBytes: BigInt(v2Content.length),
      chunkSize: v2Content.length,
      targetFileId: String(fileId),
    });

    await driveService.uploadChunk(user.id, session.sessionId, 0, v2Content);
    const completed = await driveService.completeUploadSession(user.id, session.sessionId);

    assert.strictEqual(completed.id, String(fileId));
    assert.strictEqual(completed.currentVersion, 2);

    // Verify version history record exists in database
    const versionRecords = await prisma.driveFileVersion.findMany({
      where: { fileId },
    });
    assert.strictEqual(versionRecords.length, 1);
    assert.strictEqual(versionRecords[0].versionNumber, 1);
  });

  it("should clean up staged chunks when upload session is aborted", async () => {
    const chunk = Buffer.from("Partial abort chunk test");
    const session = await driveService.initUploadSession(user.id, {
      filename: "aborted-file.bin",
      mimeType: "application/octet-stream",
      totalBytes: 1000n,
      chunkSize: 100,
    });

    await driveService.uploadChunk(user.id, session.sessionId, 0, chunk);
    const abortRes = await driveService.abortUploadSession(user.id, session.sessionId);
    assert.strictEqual(abortRes.success, true);

    const sessionDb = await prisma.driveUploadSession.findUnique({
      where: { id: session.sessionId },
    });
    assert.strictEqual(sessionDb?.status, "ABORTED");
  });

  it("should reject upload when user exceeds total quota limit", async () => {
    const hugeFakeBytes = 16n * 1024n * 1024n * 1024n; // 16 GB (> 15 GB quota)

    await assert.rejects(
      async () => {
        await driveService.initUploadSession(user.id, {
          filename: "huge-file.iso",
          mimeType: "application/octet-stream",
          totalBytes: hugeFakeBytes,
          chunkSize: 5 * 1024 * 1024,
        });
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.match(err.message, /Storage quota exceeded/);
        return true;
      },
    );
  });
});
