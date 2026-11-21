import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../../src/infrastructure/database/prisma.js";
import { driveService } from "../../src/modules/drive/drive.service.js";
import AppError from "../../src/common/errors/AppError.js";

describe("Task 2.1: Drive Core CRUD Operations Integration Tests", () => {
  let userA: any;
  let userB: any;
  let testAsset: any;

  before(async () => {
    const unique = Date.now();
    userA = await prisma.user.create({
      data: {
        fullName: "Drive User A",
        username: `user_a_${unique}`,
        email: `usera_${unique}@test.com`,
      },
    });

    userB = await prisma.user.create({
      data: {
        fullName: "Drive User B",
        username: `user_b_${unique}`,
        email: `userb_${unique}@test.com`,
      },
    });

    testAsset = await prisma.fileAsset.create({
      data: {
        publicId: `test_crud_asset_${unique}`,
        resourceType: "RAW",
        deliveryType: "AUTHENTICATED",
        originalFilename: "sample.pdf",
        mimeType: "application/pdf",
        bytes: 5000n,
        uploadedBy: userA.id,
        storageBackend: "LOCAL",
      },
    });
  });

  after(async () => {
    await prisma.driveFavorite.deleteMany();
    await prisma.driveActivity.deleteMany();
    await prisma.driveFile.deleteMany();
    await prisma.driveFolder.deleteMany();
    await prisma.fileAsset.deleteMany({ where: { id: testAsset.id } });
    await prisma.user.deleteMany({
      where: { id: { in: [userA.id, userB.id] } },
    });
  });

  it("should create folders and automatically resolve duplicate names", async () => {
    const f1 = await driveService.createFolder(userA.id, {
      name: "Documents",
      color: "#4285f4",
      description: "My personal documents",
    });

    assert.equal(f1.name, "Documents");
    assert.equal(f1.color, "#4285f4");
    assert.equal(f1.description, "My personal documents");

    // Creating another folder with the same name in the same parent -> "Documents (1)"
    const f2 = await driveService.createFolder(userA.id, {
      name: "Documents",
    });

    assert.equal(f2.name, "Documents (1)");
  });

  it("should retrieve folder with hierarchical breadcrumbs", async () => {
    const parent = await driveService.createFolder(userA.id, { name: "Projects" });
    const child = await driveService.createFolder(userA.id, {
      name: "Orvexa",
      parentFolderId: parent.id,
    });
    const subchild = await driveService.createFolder(userA.id, {
      name: "DriveModule",
      parentFolderId: child.id,
    });

    const folderDetails = await driveService.getFolder(userA.id, BigInt(subchild.id));
    assert.equal(folderDetails.name, "DriveModule");
    assert.equal(folderDetails.breadcrumbs.length, 3);
    assert.equal(folderDetails.breadcrumbs[0].name, "Projects");
    assert.equal(folderDetails.breadcrumbs[1].name, "Orvexa");
    assert.equal(folderDetails.breadcrumbs[2].name, "DriveModule");
  });

  it("should update folder name, color, and description", async () => {
    const folder = await driveService.createFolder(userA.id, { name: "To Rename" });
    const updated = await driveService.updateFolder(userA.id, BigInt(folder.id), {
      name: "Renamed Folder",
      color: "#0f9d58",
      description: "Updated description",
    });

    assert.equal(updated.name, "Renamed Folder");
    assert.equal(updated.color, "#0f9d58");
    assert.equal(updated.description, "Updated description");
  });

  it("should soft delete folder to trash and restore it", async () => {
    const folder = await driveService.createFolder(userA.id, { name: "Trash Test" });
    const folderId = BigInt(folder.id);

    // Delete to trash
    const delRes = await driveService.deleteFolder(userA.id, folderId);
    assert.equal(delRes.success, true);

    const trashedDb = await prisma.driveFolder.findUnique({ where: { id: folderId } });
    assert.ok(trashedDb?.deletedAt !== null);

    // Attempting to list contents of trashed folder throws error
    await assert.rejects(
      async () => {
        await driveService.listItems(userA.id, { folderId: folder.id });
      },
      (err: any) => err instanceof AppError && err.statusCode === 400,
    );

    // Restore
    const restRes = await driveService.restoreFolder(userA.id, folderId);
    assert.equal(restRes.success, true);

    const restoredDb = await prisma.driveFolder.findUnique({ where: { id: folderId } });
    assert.equal(restoredDb?.deletedAt, null);
  });

  it("should list items with accurate pagination and star status", async () => {
    const parent = await driveService.createFolder(userA.id, { name: "ListContainer" });
    const parentId = BigInt(parent.id);

    // Create 2 subfolders
    const sf1 = await driveService.createFolder(userA.id, {
      name: "SubA",
      parentFolderId: parent.id,
    });
    await driveService.createFolder(userA.id, {
      name: "SubB",
      parentFolderId: parent.id,
    });

    // Create file
    const file = await prisma.driveFile.create({
      data: {
        name: "Test Doc.pdf",
        ownerId: userA.id,
        folderId: parentId,
        assetId: testAsset.id,
      },
    });

    // Star SubA
    await driveService.toggleStar(userA.id, { id: sf1.id, type: "folder", isStarred: true });

    const listRes = await driveService.listItems(userA.id, { folderId: parent.id });
    assert.equal(listRes.folders.length, 2);
    assert.equal(listRes.files.length, 1);

    const starredFolder = listRes.folders.find((f) => f.id === sf1.id);
    assert.equal(starredFolder?.isStarred, true);

    const unstarredFolder = listRes.folders.find((f) => f.id !== sf1.id);
    assert.equal(unstarredFolder?.isStarred, false);
  });

  it("should move items and prevent circular moves", async () => {
    const fA = await driveService.createFolder(userA.id, { name: "DirA" });
    const fB = await driveService.createFolder(userA.id, {
      name: "DirB",
      parentFolderId: fA.id,
    });
    const fC = await driveService.createFolder(userA.id, {
      name: "DirC",
      parentFolderId: fB.id,
    });

    // Attempt circular move: move DirA into DirC
    await assert.rejects(
      async () => {
        await driveService.moveItems(userA.id, {
          items: [{ id: fA.id, type: "folder" }],
          destinationFolderId: fC.id,
        });
      },
      (err: any) =>
        err instanceof AppError &&
        err.message.includes("Cannot move a folder into itself or any of its subfolders"),
    );

    // Valid move: move DirC to root
    const moveRes = await driveService.moveItems(userA.id, {
      items: [{ id: fC.id, type: "folder" }],
      destinationFolderId: null,
    });
    assert.equal(moveRes.success, true);

    const cDb = await prisma.driveFolder.findUnique({ where: { id: BigInt(fC.id) } });
    assert.equal(cDb?.parentFolderId, null);
  });

  it("should copy file and resolve duplicate name", async () => {
    const file = await prisma.driveFile.create({
      data: {
        name: "Budget.pdf",
        ownerId: userA.id,
        assetId: testAsset.id,
      },
    });

    const copy1 = await driveService.copyItem(userA.id, { fileId: String(file.id) });
    assert.equal(copy1.name, "Copy of Budget.pdf");

    const copy2 = await driveService.copyItem(userA.id, { fileId: String(file.id) });
    assert.equal(copy2.name, "Copy of Budget (1).pdf");
  });

  it("should calculate user storage usage accurately", async () => {
    const storage = await driveService.getUserStorage(userA.id);
    assert.ok(BigInt(storage.usedBytes) > 0n);
    assert.equal(typeof storage.usagePercentage, "number");
    assert.ok(storage.fileCount > 0);
  });

  it("should permanently delete folder and its files", async () => {
    const toDelete = await driveService.createFolder(userA.id, { name: "To Purge Forever" });
    const toDeleteId = BigInt(toDelete.id);

    const fileInside = await prisma.driveFile.create({
      data: {
        name: "Inside.pdf",
        ownerId: userA.id,
        folderId: toDeleteId,
        assetId: testAsset.id,
      },
    });

    const permRes = await driveService.permanentDeleteFolder(userA.id, toDeleteId);
    assert.equal(permRes.success, true);

    const folderExists = await prisma.driveFolder.findUnique({ where: { id: toDeleteId } });
    assert.equal(folderExists, null);

    const fileExists = await prisma.driveFile.findUnique({ where: { id: fileInside.id } });
    assert.equal(fileExists, null);
  });
});
