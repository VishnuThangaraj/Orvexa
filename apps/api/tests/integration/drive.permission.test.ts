import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import prisma from "../../src/infrastructure/database/prisma.js";
import drivePermissionService from "../../src/modules/drive/drive.permission.js";
import AppError from "../../src/common/errors/AppError.js";

describe("Task 1.3: DrivePermissionService Integration Tests", () => {
  let userOwner: any;
  let userEditor: any;
  let userViewer: any;
  let userUnshared: any;
  let testAsset: any;

  before(async () => {
    // Create test users
    const unique = Date.now();
    userOwner = await prisma.user.create({
      data: {
        fullName: "Drive Owner",
        username: `owner_${unique}`,
        email: `owner_${unique}@test.com`,
      },
    });

    userEditor = await prisma.user.create({
      data: {
        fullName: "Drive Editor",
        username: `editor_${unique}`,
        email: `editor_${unique}@test.com`,
      },
    });

    userViewer = await prisma.user.create({
      data: {
        fullName: "Drive Viewer",
        username: `viewer_${unique}`,
        email: `viewer_${unique}@test.com`,
      },
    });

    userUnshared = await prisma.user.create({
      data: {
        fullName: "Drive Unshared",
        username: `unshared_${unique}`,
        email: `unshared_${unique}@test.com`,
      },
    });

    testAsset = await prisma.fileAsset.create({
      data: {
        publicId: `test_asset_${unique}`,
        resourceType: "RAW",
        deliveryType: "AUTHENTICATED",
        originalFilename: "test.txt",
        mimeType: "text/plain",
        bytes: 100n,
        uploadedBy: userOwner.id,
        storageBackend: "LOCAL",
      },
    });
  });

  after(async () => {
    await prisma.drivePermission.deleteMany();
    await prisma.driveShareLink.deleteMany();
    await prisma.driveFile.deleteMany();
    await prisma.driveFolder.deleteMany();
    await prisma.fileAsset.deleteMany({ where: { id: testAsset.id } });
    await prisma.user.deleteMany({
      where: {
        id: { in: [userOwner.id, userEditor.id, userViewer.id, userUnshared.id] },
      },
    });
  });

  it("should recognize owner as OWNER with full rights", async () => {
    const folder = await prisma.driveFolder.create({
      data: {
        name: "Owner Folder",
        ownerId: userOwner.id,
      },
    });

    const perm = await drivePermissionService.getEffectivePermission(userOwner.id, {
      folderId: folder.id,
    });
    assert.equal(perm.role, "OWNER");
    assert.equal(perm.isOwner, true);
  });

  it("should inherit permissions down the folder hierarchy", async () => {
    // 1. Root folder
    const rootFolder = await prisma.driveFolder.create({
      data: {
        name: "Root Parent",
        ownerId: userOwner.id,
      },
    });

    // 2. Grant EDITOR on Root Parent to userEditor
    await prisma.drivePermission.create({
      data: {
        folderId: rootFolder.id,
        userId: userEditor.id,
        accessLevel: "EDITOR",
        grantedBy: userOwner.id,
      },
    });

    // 3. Child folder inside Root Parent
    const childFolder = await prisma.driveFolder.create({
      data: {
        name: "Child Subfolder",
        ownerId: userOwner.id,
        parentFolderId: rootFolder.id,
      },
    });

    // 4. File inside Child Subfolder
    const file = await prisma.driveFile.create({
      data: {
        name: "Deep Nested File.txt",
        ownerId: userOwner.id,
        folderId: childFolder.id,
        assetId: testAsset.id,
      },
    });

    // userEditor has NO direct permission on file, but inherits EDITOR from rootFolder
    const perm = await drivePermissionService.getEffectivePermission(userEditor.id, {
      fileId: file.id,
    });
    assert.equal(perm.role, "EDITOR");
    assert.equal(perm.isOwner, false);

    // userUnshared has NONE
    const unsharedPerm = await drivePermissionService.getEffectivePermission(userUnshared.id, {
      fileId: file.id,
    });
    assert.equal(unsharedPerm.role, "NONE");
  });

  it("should prioritize direct item permission over inherited permission", async () => {
    const parentFolder = await prisma.driveFolder.create({
      data: {
        name: "Parent For Override",
        ownerId: userOwner.id,
      },
    });

    // Grant EDITOR on parent
    await prisma.drivePermission.create({
      data: {
        folderId: parentFolder.id,
        userId: userEditor.id,
        accessLevel: "EDITOR",
        grantedBy: userOwner.id,
      },
    });

    // Create file in parent
    const file = await prisma.driveFile.create({
      data: {
        name: "Restricted File.txt",
        ownerId: userOwner.id,
        folderId: parentFolder.id,
        assetId: testAsset.id,
      },
    });

    // Directly restrict userEditor to VIEWER on this specific file
    await prisma.drivePermission.create({
      data: {
        fileId: file.id,
        userId: userEditor.id,
        accessLevel: "VIEWER",
        grantedBy: userOwner.id,
      },
    });

    const perm = await drivePermissionService.getEffectivePermission(userEditor.id, {
      fileId: file.id,
    });
    // Direct VIEWER takes precedence over inherited EDITOR
    assert.equal(perm.role, "VIEWER");
  });

  it("should accurately detect circular folder moves via recursive CTE", async () => {
    // Create: Folder A -> Folder B -> Folder C
    const folderA = await prisma.driveFolder.create({
      data: { name: "Folder A", ownerId: userOwner.id },
    });
    const folderB = await prisma.driveFolder.create({
      data: { name: "Folder B", ownerId: userOwner.id, parentFolderId: folderA.id },
    });
    const folderC = await prisma.driveFolder.create({
      data: { name: "Folder C", ownerId: userOwner.id, parentFolderId: folderB.id },
    });

    const unrelatedFolder = await prisma.driveFolder.create({
      data: { name: "Folder Unrelated", ownerId: userOwner.id },
    });

    // 1. Moving Folder A into Folder C is circular (C is a descendant of A)
    const isCycle1 = await drivePermissionService.checkCircularMove(folderA.id, folderC.id);
    assert.equal(isCycle1, true);

    // 2. Moving Folder A into Folder B is circular (B is child of A)
    const isCycle2 = await drivePermissionService.checkCircularMove(folderA.id, folderB.id);
    assert.equal(isCycle2, true);

    // 3. Moving Folder A into Folder A is circular
    const isCycle3 = await drivePermissionService.checkCircularMove(folderA.id, folderA.id);
    assert.equal(isCycle3, true);

    // 4. Moving Folder C into Folder A is VALID (C moves up)
    const isCycle4 = await drivePermissionService.checkCircularMove(folderC.id, folderA.id);
    assert.equal(isCycle4, false);

    // 5. Moving Folder A into unrelatedFolder is VALID
    const isCycle5 = await drivePermissionService.checkCircularMove(folderA.id, unrelatedFolder.id);
    assert.equal(isCycle5, false);

    // 6. Moving to root (null) is VALID
    const isCycle6 = await drivePermissionService.checkCircularMove(folderC.id, null);
    assert.equal(isCycle6, false);
  });

  it("should validate share link token correctly", async () => {
    const file = await prisma.driveFile.create({
      data: {
        name: "Link Shared File.txt",
        ownerId: userOwner.id,
        assetId: testAsset.id,
      },
    });

    const token = crypto.randomBytes(32).toString("hex");
    await prisma.driveShareLink.create({
      data: {
        fileId: file.id,
        token,
        role: "VIEWER",
        createdBy: userOwner.id,
      },
    });

    // userUnshared accesses file with valid link token -> gets VIEWER
    const permWithToken = await drivePermissionService.getEffectivePermission(
      userUnshared.id,
      { fileId: file.id },
      token,
    );
    assert.equal(permWithToken.role, "VIEWER");

    // Without token -> gets NONE
    const permWithoutToken = await drivePermissionService.getEffectivePermission(
      userUnshared.id,
      { fileId: file.id },
    );
    assert.equal(permWithoutToken.role, "NONE");
  });
});
