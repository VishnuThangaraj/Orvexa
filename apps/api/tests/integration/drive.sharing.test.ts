import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../../src/infrastructure/database/prisma.js";
import { driveService } from "../../src/modules/drive/drive.service.js";
import AppError from "../../src/common/errors/AppError.js";

describe("Phase 4: Sharing, Permissions, Unguessable Links & Request Access Integration Tests", () => {
  let owner: any;
  let editor: any;
  let viewer: any;
  let outsider: any;
  let testFile: any;
  let testFolder: any;

  before(async () => {
    const unique = Date.now();

    owner = await prisma.user.create({
      data: {
        fullName: "Drive Share Owner",
        username: `share_owner_${unique}`,
        email: `share_owner_${unique}@test.com`,
      },
    });

    editor = await prisma.user.create({
      data: {
        fullName: "Drive Share Editor",
        username: `share_editor_${unique}`,
        email: `share_editor_${unique}@test.com`,
      },
    });

    viewer = await prisma.user.create({
      data: {
        fullName: "Drive Share Viewer",
        username: `share_viewer_${unique}`,
        email: `share_viewer_${unique}@test.com`,
      },
    });

    outsider = await prisma.user.create({
      data: {
        fullName: "Drive Share Outsider",
        username: `share_outsider_${unique}`,
        email: `share_outsider_${unique}@test.com`,
      },
    });

    // Create a folder and file
    testFolder = await driveService.createFolder(owner.id, {
      name: "Shared Project",
    });

    const [file] = await driveService.uploadFiles(
      owner.id,
      [
        {
          originalname: "proposal.pdf",
          buffer: Buffer.from("Shared proposal content"),
          mimetype: "application/pdf",
          size: 23,
        },
      ],
      testFolder.id,
    );
    testFile = file;
  });

  after(async () => {
    await prisma.driveActivity.deleteMany();
    await prisma.driveShortcut.deleteMany();
    await prisma.driveAccessRequest.deleteMany();
    await prisma.driveShareLink.deleteMany();
    await prisma.drivePermission.deleteMany();
    await prisma.driveFile.deleteMany();
    await prisma.driveFolder.deleteMany();
    await prisma.fileAsset.deleteMany({
      where: { uploadedBy: owner.id },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [owner.id, editor.id, viewer.id, outsider.id] } },
    });
  });

  it("should search users by email/name for autocomplete", async () => {
    const results = await driveService.searchUsers(editor.email.slice(0, 10), owner.id);
    assert.ok(results.length > 0);
    const match = results.find((u) => u.email === editor.email);
    assert.ok(match);
    assert.strictEqual(match.fullName, "Drive Share Editor");
  });

  it("should add, list, update, and remove collaborator permissions", async () => {
    // 1. Add editor collaborator
    const perm1 = await driveService.addPermission(
      owner.id,
      { fileId: BigInt(testFile.id) },
      { email: editor.email, accessLevel: "EDITOR" },
    );
    assert.strictEqual(perm1.accessLevel, "EDITOR");
    assert.strictEqual(perm1.user.email, editor.email);

    // 2. Add viewer collaborator
    await driveService.addPermission(
      owner.id,
      { fileId: BigInt(testFile.id) },
      { email: viewer.email, accessLevel: "VIEWER" },
    );

    // 3. List permissions
    const list = await driveService.listPermissions(owner.id, {
      fileId: BigInt(testFile.id),
    });
    assert.strictEqual(list.owner.email, owner.email);
    assert.strictEqual(list.permissions.length, 2);
    assert.strictEqual(list.canManagePermissions, true);

    // 4. Update permission (promote viewer to commenter)
    const viewerPerm = list.permissions.find((p) => p.user.email === viewer.email);
    assert.ok(viewerPerm);
    const updated = await driveService.updatePermission(
      owner.id,
      BigInt(viewerPerm.id),
      "COMMENTER",
    );
    assert.strictEqual(updated.accessLevel, "COMMENTER");

    // 5. Remove permission
    const removeRes = await driveService.removePermission(owner.id, BigInt(viewerPerm.id));
    assert.strictEqual(removeRes.success, true);

    // 6. Verify removed from list
    const afterList = await driveService.listPermissions(owner.id, {
      fileId: BigInt(testFile.id),
    });
    assert.strictEqual(afterList.permissions.length, 1);
  });

  it("should enforce preventEditorSharing restriction against editors", async () => {
    // 1. Enable preventEditorSharing on file
    await driveService.updateFile(owner.id, BigInt(testFile.id), {
      preventEditorSharing: true,
    });

    // 2. Editor attempting to add another collaborator should be rejected
    await assert.rejects(
      async () => {
        await driveService.addPermission(
          editor.id,
          { fileId: BigInt(testFile.id) },
          { email: outsider.email, accessLevel: "VIEWER" },
        );
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 403);
        assert.match(err.message, /owner can modify/);
        return true;
      },
    );

    // Reset preventEditorSharing
    await driveService.updateFile(owner.id, BigInt(testFile.id), {
      preventEditorSharing: false,
    });
  });

  it("should generate unguessable link tokens, allow regeneration and revoking", async () => {
    // 1. Create share link
    const linkRes = await driveService.updateShareLink(
      owner.id,
      { fileId: BigInt(testFile.id) },
      { role: "VIEWER", allowAnonymous: false },
    );
    assert.strictEqual(linkRes.revoked, false);
    assert.ok(linkRes.shareLink);
    assert.strictEqual(linkRes.shareLink.role, "VIEWER");
    assert.ok(linkRes.shareLink.token.length >= 32);

    const firstToken = linkRes.shareLink.token;

    // 2. Regenerate link token
    const regenRes = await driveService.updateShareLink(
      owner.id,
      { fileId: BigInt(testFile.id) },
      { role: "VIEWER", regenerateToken: true },
    );
    assert.ok(regenRes.shareLink);
    assert.notStrictEqual(regenRes.shareLink.token, firstToken);

    // 3. Revoke link
    const revokeRes = await driveService.updateShareLink(
      owner.id,
      { fileId: BigInt(testFile.id) },
      { role: "VIEWER", revoke: true },
    );
    assert.strictEqual(revokeRes.revoked, true);
    assert.strictEqual(revokeRes.shareLink, null);
  });

  it("should handle access request flow: create, list, and approve with automatic permission grant", async () => {
    // 1. Outsider requests access
    const req = await driveService.createAccessRequest(outsider.id, {
      fileId: BigInt(testFile.id),
      requestedRole: "EDITOR",
      message: "Please give me edit access for the review",
    });
    assert.strictEqual(req.status, "PENDING");
    assert.strictEqual(req.requestedRole, "EDITOR");

    // 2. Owner lists pending access requests
    const pending = await driveService.listAccessRequests(owner.id);
    const match = pending.find((p) => p.id === req.id);
    assert.ok(match);
    assert.strictEqual(match.requester.email, outsider.email);
    assert.strictEqual(match.message, "Please give me edit access for the review");

    // 3. Owner approves the request
    const approved = await driveService.respondAccessRequest(
      owner.id,
      BigInt(req.id),
      "APPROVE",
    );
    assert.strictEqual(approved.status, "APPROVED");

    // 4. Verify outsider now has real EDITOR permission
    const list = await driveService.listPermissions(owner.id, {
      fileId: BigInt(testFile.id),
    });
    const outsiderPerm = list.permissions.find((p) => p.user.email === outsider.email);
    assert.ok(outsiderPerm);
    assert.strictEqual(outsiderPerm.accessLevel, "EDITOR");
  });

  it("should list items in Shared With Me and create/delete shortcuts", async () => {
    // Outsider checks Shared With Me
    const shared = await driveService.listSharedWithMe(outsider.id);
    assert.ok(shared.files.length > 0);
    const sharedFile = shared.files.find((f) => f.id === String(testFile.id));
    assert.ok(sharedFile);
    assert.strictEqual(sharedFile.name, "proposal.pdf");
    assert.strictEqual(sharedFile.sharedBy.email, owner.email);

    // Outsider adds shortcut to My Drive
    const shortcut = await driveService.createShortcut(outsider.id, {
      targetType: "file",
      targetId: BigInt(testFile.id),
    });
    assert.ok(shortcut.id);
    assert.strictEqual(shortcut.name, "proposal.pdf");

    // Delete shortcut
    const delRes = await driveService.deleteShortcut(outsider.id, BigInt(shortcut.id));
    assert.strictEqual(delRes.success, true);
  });

  it("should resolve share link tokens and check access status", async () => {
    // 1. Create share link for folder
    const linkRes = await driveService.updateShareLink(
      owner.id,
      { folderId: BigInt(testFolder.id) },
      { role: "VIEWER", allowAnonymous: false },
    );
    const token = linkRes.shareLink!.token;

    // 2. Resolve link as outsider
    const resolved = await driveService.resolveShareLink(outsider.id, token);
    assert.strictEqual(resolved.hasAccess, true);
    assert.strictEqual(resolved.shareLink.role, "VIEWER");
    assert.strictEqual(resolved.item.name, "Shared Project");
    assert.strictEqual(resolved.item.type, "folder");
  });
});
