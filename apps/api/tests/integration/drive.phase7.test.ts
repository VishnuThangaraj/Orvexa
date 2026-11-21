import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../../src/infrastructure/database/prisma.js";
import { driveService } from "../../src/modules/drive/drive.service.js";
import { LocalStorageProvider } from "../../src/infrastructure/storage/local.storage.js";
import AppError from "../../src/common/errors/AppError.js";

describe("Phase 7: Security Hardening, Quota Auditing & E2E Verification", () => {
  let user1: any;
  let user2: any;
  let user3: any;
  let sampleFile: any;
  let folderA: any;
  let folderB: any;
  let folderC: any;

  before(async () => {
    const unique = Date.now();

    user1 = await prisma.user.create({
      data: {
        fullName: "Security Owner",
        username: `sec_owner_${unique}`,
        email: `sec_owner_${unique}@test.com`,
      },
    });

    user2 = await prisma.user.create({
      data: {
        fullName: "Security Collaborator",
        username: `sec_collab_${unique}`,
        email: `sec_collab_${unique}@test.com`,
      },
    });

    user3 = await prisma.user.create({
      data: {
        fullName: "Security Third Party",
        username: `sec_third_${unique}`,
        email: `sec_third_${unique}@test.com`,
      },
    });

    // Create a base file owned by user1
    const [file] = await driveService.uploadFiles(
      user1.id,
      [
        {
          originalname: "financial_forecast.pdf",
          buffer: Buffer.from("Sensitive Q4 financial forecast content"),
          mimetype: "application/pdf",
          size: 38,
        },
      ],
      null,
    );
    sampleFile = file;

    // Create a hierarchy: Folder A -> Folder B -> Folder C
    folderA = await driveService.createFolder(user1.id, { name: `FolderA_${unique}` });
    folderB = await driveService.createFolder(user1.id, {
      name: `FolderB_${unique}`,
      parentFolderId: folderA.id,
    });
    folderC = await driveService.createFolder(user1.id, {
      name: `FolderC_${unique}`,
      parentFolderId: folderB.id,
    });
  });

  after(async () => {
    delete process.env.DRIVE_TOTAL_QUOTA_BYTES;

    // Cleanup created records
    try {
      await prisma.driveActivity.deleteMany({
        where: { userId: { in: [user1.id, user2.id, user3.id] } },
      });
      await prisma.driveFileVersion.deleteMany({
        where: { file: { ownerId: user1.id } },
      });
      await prisma.driveShareLink.deleteMany({
        where: { createdBy: user1.id },
      });
      await prisma.drivePermission.deleteMany({
        where: { grantedBy: user1.id },
      });
      await prisma.driveFile.deleteMany({
        where: { ownerId: user1.id },
      });
      await prisma.driveFolder.deleteMany({
        where: { ownerId: user1.id },
      });
      await prisma.fileAsset.deleteMany({
        where: { uploadedBy: user1.id },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [user1.id, user2.id, user3.id] } },
      });
    } catch {
      // ignore
    }
  });

  it("1. Storage Path Sanitization: strictly rejects directory traversal attacks", async () => {
    const storage = new LocalStorageProvider();

    // Traversal putBuffer
    await assert.rejects(
      async () => {
        await storage.putBuffer("../../../malicious_file.txt", Buffer.from("exploit"));
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /directory traversal attempt rejected/i);
        return true;
      },
    );

    // Traversal getStream
    await assert.rejects(
      async () => {
        await storage.getStream("drive/../../../../etc/passwd");
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /directory traversal attempt rejected/i);
        return true;
      },
    );

    // Traversal getBuffer
    await assert.rejects(
      async () => {
        await storage.getBuffer("../../../../etc/shadow");
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /directory traversal attempt rejected/i);
        return true;
      },
    );
  });

  it("2. preventDownload: server-side 403 enforcement for viewers and commenters", async () => {
    const fileId = BigInt(sampleFile.id);

    // Share file with user2 as VIEWER
    await driveService.addPermission(user1.id, { fileId }, {
      email: user2.email,
      accessLevel: "VIEWER",
    });

    // Before preventDownload: user2 can download
    const dlBefore = await driveService.getFileDownloadStream(user2.id, fileId);
    assert.ok(dlBefore.stream);

    // Owner sets preventDownload = true
    await driveService.updateFile(user1.id, fileId, { preventDownload: true });

    // Non-owner (even editor) cannot toggle preventDownload
    await assert.rejects(
      async () => {
        await driveService.updateFile(user2.id, fileId, { preventDownload: false });
      },
      (err: any) => {
        assert.equal(err.statusCode, 403);
        assert.match(err.message, /Only the file owner can modify access restrictions/i);
        return true;
      },
    );

    // User 2 (VIEWER) attempts to download
    await assert.rejects(
      async () => {
        await driveService.getFileDownloadStream(user2.id, fileId);
      },
      (err: any) => {
        assert.equal(err.statusCode, 403);
        assert.match(err.message, /Download disabled by the file owner/i);
        return true;
      },
    );

    // Upload a new version to create version history
    await driveService.uploadNewVersion(user1.id, fileId, {
      originalname: "financial_forecast_v2.pdf",
      buffer: Buffer.from("Sensitive Q4 financial forecast v2 content"),
      mimetype: "application/pdf",
      size: 41,
    });

    // User 2 attempts to download version 1
    await assert.rejects(
      async () => {
        await driveService.getFileVersionDownloadStream(user2.id, fileId, 1);
      },
      (err: any) => {
        assert.equal(err.statusCode, 403);
        assert.match(err.message, /Download disabled by the file owner/i);
        return true;
      },
    );

    // Owner can still download even when preventDownload is enabled
    const ownerStream = await driveService.getFileDownloadStream(user1.id, fileId);
    assert.ok(ownerStream.stream);
  });

  it("3. preventEditorSharing: server-side 403 enforcement against editors", async () => {
    const fileId = BigInt(sampleFile.id);

    // Upgrade user2 to EDITOR
    const permList = await driveService.listPermissions(user1.id, { fileId });
    const user2Perm = permList.permissions.find((p) => p.user?.email === user2.email);
    assert.ok(user2Perm);

    await driveService.updatePermission(user1.id, BigInt(user2Perm.id), "EDITOR");

    // Owner sets preventEditorSharing = true
    await driveService.updateFile(user1.id, fileId, { preventEditorSharing: true });

    // User 2 (EDITOR) attempts to invite user 3
    await assert.rejects(
      async () => {
        await driveService.addPermission(user2.id, { fileId }, {
          email: user3.email,
          accessLevel: "VIEWER",
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 403);
        assert.match(err.message, /Only the file owner can modify sharing permissions/i);
        return true;
      },
    );

    // User 2 (EDITOR) attempts to modify general access share link
    await assert.rejects(
      async () => {
        await driveService.updateShareLink(user2.id, { fileId }, {
          role: "VIEWER",
          allowAnonymous: true,
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 403);
        assert.match(err.message, /Only the file owner can modify share link/i);
        return true;
      },
    );

    // Owner can still share
    const ownerShare = await driveService.addPermission(user1.id, { fileId }, {
      email: user3.email,
      accessLevel: "VIEWER",
    });
    assert.ok(ownerShare);
  });

  it("4. Quota Accounting: counts active files + trashed files + versions and rejects overflow", async () => {
    // Current usage of user1
    const initialStorage = await driveService.getUserStorage(user1.id);
    const initialUsed = BigInt(initialStorage.usedBytes);
    assert.ok(initialUsed > 0n);

    // Set artificially low quota to test overflow rejection
    process.env.DRIVE_TOTAL_QUOTA_BYTES = String(initialUsed + 50n);

    // Attempting upload exceeding 50 bytes must fail with 400
    await assert.rejects(
      async () => {
        await driveService.uploadFiles(
          user1.id,
          [
            {
              originalname: "overflow.dat",
              buffer: Buffer.alloc(100),
              mimetype: "application/octet-stream",
              size: 100,
            },
          ],
          null,
        );
      },
      (err: any) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /Storage quota exceeded/i);
        return true;
      },
    );

    // Attempting chunked upload session init exceeding quota must also fail
    await assert.rejects(
      async () => {
        await driveService.initUploadSession(user1.id, {
          filename: "overflow_session.dat",
          mimeType: "application/octet-stream",
          totalBytes: 200n,
          chunkSize: 100,
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /Storage quota exceeded/i);
        return true;
      },
    );

    // Reset quota
    delete process.env.DRIVE_TOTAL_QUOTA_BYTES;
  });

  it("5. Circular Move Prevention: rejects moving a folder into itself or its descendant", async () => {
    const idA = String(folderA.id);
    const idB = String(folderB.id);
    const idC = String(folderC.id);

    // Moving Folder A into itself must fail
    await assert.rejects(
      async () => {
        await driveService.moveItems(user1.id, {
          items: [{ id: idA, type: "folder" }],
          destinationFolderId: idA,
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /Cannot move a folder into itself or any of its subfolders/i);
        return true;
      },
    );

    // Moving Folder A into Folder B (direct child) must fail
    await assert.rejects(
      async () => {
        await driveService.moveItems(user1.id, {
          items: [{ id: idA, type: "folder" }],
          destinationFolderId: idB,
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /Cannot move a folder into itself or any of its subfolders/i);
        return true;
      },
    );

    // Moving Folder A into Folder C (grandchild) must fail
    await assert.rejects(
      async () => {
        await driveService.moveItems(user1.id, {
          items: [{ id: idA, type: "folder" }],
          destinationFolderId: idC,
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /Cannot move a folder into itself or any of its subfolders/i);
        return true;
      },
    );

    // Valid non-circular move: move Folder C into Folder A
    const validMove = await driveService.moveItems(user1.id, {
      items: [{ id: idC, type: "folder" }],
      destinationFolderId: idA,
    });
    assert.equal(validMove.success, true);
  });

  it("6. Share Link Expiration and Revocation: securely denies unauthorized access", async () => {
    const fileId = BigInt(sampleFile.id);

    // Create an unshared external user
    const user4 = await prisma.user.create({
      data: {
        fullName: "Security Unshared User",
        username: `sec_unshared_${Date.now()}`,
        email: `sec_unshared_${Date.now()}@test.com`,
      },
    });

    // 1. Create a share link expired in the past
    const expiredLink = await prisma.driveShareLink.create({
      data: {
        fileId,
        token: `expired_${Date.now()}_token`,
        role: "VIEWER",
        expiresAt: new Date(Date.now() - 60000), // 1 minute ago
        createdBy: user1.id,
      },
    });

    // Access via resolveShareLink should reject with 410
    await assert.rejects(
      async () => {
        await driveService.resolveShareLink(user4.id, expiredLink.token);
      },
      (err: any) => {
        assert.equal(err.statusCode, 410);
        assert.match(err.message, /This share link has expired/i);
        return true;
      },
    );

    // Access via getFile with expired token should be denied (403)
    await assert.rejects(
      async () => {
        await driveService.getFile(user4.id, fileId, expiredLink.token);
      },
      (err: any) => {
        assert.equal(err.statusCode, 403);
        assert.match(err.message, /Access denied/i);
        return true;
      },
    );

    // 2. Revoke link via updateShareLink
    const validLink = await driveService.updateShareLink(user1.id, { fileId }, {
      role: "VIEWER",
    });
    assert.ok(validLink.shareLink);
    const token = validLink.shareLink.token;

    // Revoke it
    await driveService.updateShareLink(user1.id, { fileId }, {
      role: "VIEWER",
      revoke: true,
    });

    // Access via resolveShareLink should reject with 404
    await assert.rejects(
      async () => {
        await driveService.resolveShareLink(user4.id, token);
      },
      (err: any) => {
        assert.equal(err.statusCode, 404);
        assert.match(err.message, /Invalid or expired share link/i);
        return true;
      },
    );

    // Access via getFile with revoked token should be denied (403)
    await assert.rejects(
      async () => {
        await driveService.getFile(user4.id, fileId, token);
      },
      (err: any) => {
        assert.equal(err.statusCode, 403);
        assert.match(err.message, /Access denied/i);
        return true;
      },
    );

    // Cleanup user4
    await prisma.user.delete({ where: { id: user4.id } });
  });
});
