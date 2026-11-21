import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../../src/infrastructure/database/prisma.js";
import { driveService } from "../../src/modules/drive/drive.service.js";
import { runTrashPurgeJob } from "../../src/modules/drive/drive.worker.js";

describe("Phase 5: Trash Auto-Purge, Version History, Full-Text Search & Activity Integration Tests", () => {
  let user: any;
  let testFile: any;
  let textFile: any;
  let testFolder: any;

  before(async () => {
    const unique = Date.now();

    user = await prisma.user.create({
      data: {
        fullName: "Drive Phase 5 User",
        username: `phase5_user_${unique}`,
        email: `phase5_user_${unique}@test.com`,
      },
    });

    // Create folder
    testFolder = await driveService.createFolder(user.id, {
      name: "Engineering Docs",
    });

    // Create binary file
    const [file] = await driveService.uploadFiles(
      user.id,
      [
        {
          originalname: "report.pdf",
          buffer: Buffer.from("Initial PDF report content"),
          mimetype: "application/pdf",
          size: 26,
        },
      ],
      testFolder.id,
    );
    testFile = file;

    // Create text file with searchable content
    const [txt] = await driveService.uploadFiles(
      user.id,
      [
        {
          originalname: "architecture_notes.md",
          buffer: Buffer.from("Orvexa cloud architecture and microservices design notes"),
          mimetype: "text/markdown",
          size: 55,
        },
      ],
      testFolder.id,
    );
    textFile = txt;
  });

  after(async () => {
    await prisma.driveActivity.deleteMany();
    await prisma.driveRecentItem.deleteMany();
    await prisma.driveFileVersion.deleteMany();
    await prisma.driveFile.deleteMany();
    await prisma.driveFolder.deleteMany();
    await prisma.fileAsset.deleteMany({
      where: { uploadedBy: user.id },
    });
    await prisma.user.deleteMany({
      where: { id: user.id },
    });
  });

  it("should upload a new version, list versions, download specific version, and restore older version", async () => {
    // 1. Upload Version 2
    const v2 = await driveService.uploadNewVersion(user.id, BigInt(testFile.id), {
      originalname: "report_updated.pdf",
      buffer: Buffer.from("Updated PDF report v2 content"),
      mimetype: "application/pdf",
      size: 30,
    });

    assert.strictEqual(v2.versionNumber, 2);

    // 2. List versions
    const versionList = await driveService.listFileVersions(user.id, BigInt(testFile.id));
    assert.strictEqual(versionList.currentVersion, 2);
    assert.strictEqual(versionList.versions.length, 2);

    const currentV = versionList.versions.find((v) => v.isCurrent);
    assert.ok(currentV);
    assert.strictEqual(currentV.versionNumber, 2);

    const prevV = versionList.versions.find((v) => !v.isCurrent);
    assert.ok(prevV);
    assert.strictEqual(prevV.versionNumber, 1);

    // 3. Download previous version
    const prevDownload = await driveService.getFileVersionDownloadStream(
      user.id,
      BigInt(testFile.id),
      BigInt(prevV.id),
    );
    assert.ok(prevDownload.stream);
    assert.match(prevDownload.filename, /v1/);

    // 4. Restore Version 1
    const restoreRes = await driveService.restoreFileVersion(
      user.id,
      BigInt(testFile.id),
      BigInt(prevV.id),
    );
    assert.strictEqual(restoreRes.success, true);
    assert.strictEqual(restoreRes.currentVersion, 3);

    // 5. Verify restored version is now current (version 3)
    const afterRestore = await driveService.listFileVersions(user.id, BigInt(testFile.id));
    assert.strictEqual(afterRestore.currentVersion, 3);
    assert.strictEqual(afterRestore.versions.length, 3);
  });

  it("should search items by full-text query, type filter, and modified date", async () => {
    // 1. Search by name keyword
    const searchName = await driveService.searchItems(user.id, { q: "architecture" });
    assert.ok(searchName.files.length > 0);
    assert.strictEqual(searchName.files[0].name, "architecture_notes.md");

    // 2. Search by content keyword (stored in searchableContent)
    const searchContent = await driveService.searchItems(user.id, { q: "microservices" });
    assert.ok(searchContent.files.length > 0);
    assert.strictEqual(searchContent.files[0].name, "architecture_notes.md");

    // 3. Filter by type 'folder'
    const searchFolders = await driveService.searchItems(user.id, { type: "folder" });
    assert.ok(searchFolders.folders.length > 0);
    assert.strictEqual(searchFolders.folders[0].name, "Engineering Docs");
    assert.strictEqual(searchFolders.files.length, 0);

    // 4. Filter by type 'pdf'
    const searchPdfs = await driveService.searchItems(user.id, { type: "pdf" });
    assert.ok(searchPdfs.files.length > 0);
    assert.strictEqual(searchPdfs.files[0].name, "report.pdf");
  });

  it("should track recent file access and retrieve recent list", async () => {
    // 1. Record access
    await driveService.recordRecentAccess(user.id, { fileId: BigInt(textFile.id) });

    // 2. Fetch recent files
    const recent = await driveService.listRecent(user.id, 10);
    assert.ok(recent.length > 0);
    assert.strictEqual(recent[0].id, String(textFile.id));
  });

  it("should retrieve per-item and user activity logs with human-readable events", async () => {
    const activities = await driveService.listActivities(user.id, {
      fileId: BigInt(testFile.id),
    });
    assert.ok(activities.length > 0);
    const actions = activities.map((a) => a.action);
    assert.ok(actions.includes("UPLOADED") || actions.includes("NEW_VERSION_UPLOADED"));
    assert.strictEqual(activities[0].user.email, user.email);
  });

  it("should permanently empty user trash and auto-purge expired items", async () => {
    // 1. Create temporary file and trash it
    const [tmpFile] = await driveService.uploadFiles(
      user.id,
      [
        {
          originalname: "delete_me.txt",
          buffer: Buffer.from("Temporary junk file"),
          mimetype: "text/plain",
          size: 19,
        },
      ],
      testFolder.id,
    );

    await driveService.deleteFile(user.id, BigInt(tmpFile.id));

    // 2. Empty trash
    const emptyRes = await driveService.emptyTrash(user.id);
    assert.ok(emptyRes.count >= 1);

    // Verify it is gone permanently
    const found = await prisma.driveFile.findUnique({
      where: { id: BigInt(tmpFile.id) },
    });
    assert.strictEqual(found, null);

    // 3. Test auto-purge worker with expired date
    const [expiredFile] = await driveService.uploadFiles(
      user.id,
      [
        {
          originalname: "expired.log",
          buffer: Buffer.from("Old log file"),
          mimetype: "text/plain",
          size: 12,
        },
      ],
      testFolder.id,
    );

    // Set deletedAt to 35 days ago
    const thirtyFiveDaysAgo = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
    await prisma.driveFile.update({
      where: { id: BigInt(expiredFile.id) },
      data: { deletedAt: thirtyFiveDaysAgo },
    });

    // Run purge job (retention: 30 days)
    const purgeResult = await runTrashPurgeJob(30);
    assert.ok(purgeResult.purgedFiles >= 1);

    const expiredFound = await prisma.driveFile.findUnique({
      where: { id: BigInt(expiredFile.id) },
    });
    assert.strictEqual(expiredFound, null);
  });
});
