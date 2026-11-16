import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import app from "../../src/app.js";
import prisma from "../../src/infrastructure/database/prisma.js";
import env from "../../src/config/env.js";
import { generateAccessToken } from "../../src/common/utils/jwt.js";

test("Chat Attachments & Media Handling Integration Tests", async (t) => {
  const adminUser = await prisma.user.findUnique({
    where: { email: env.ADMIN_EMAIL },
  });
  assert.ok(adminUser, "Admin user must exist");

  const memberUser = await prisma.user.findFirst({
    where: { email: "vignesh@gmail.com" },
  });
  assert.ok(memberUser, "Member user must exist");

  const adminToken = generateAccessToken({
    id: adminUser.id,
    role: adminUser.role,
  });

  const memberToken = generateAccessToken({
    id: memberUser.id,
    role: memberUser.role,
  });

  const httpServer = http.createServer(app);
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const port = (httpServer.address() as AddressInfo).port;
  const restBaseUrl = `http://127.0.0.1:${port}/api/chat`;

  let conversationId: string;
  let uploadedAssetId: string;
  let unlinkedAssetId: string;

  // Create test conversation
  const createConvRes = await fetch(`${restBaseUrl}/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: "Attachments Test Room",
      type: "GROUP",
      participantIds: [String(memberUser.id)],
    }),
  });
  const convJson = await createConvRes.json();
  conversationId = String(convJson.data.id);

  t.after(async () => {
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));

    if (conversationId) {
      await prisma.conversation.deleteMany({
        where: { id: BigInt(conversationId) },
      });
    }

    if (uploadedAssetId) {
      await prisma.fileAsset.deleteMany({
        where: { id: BigInt(uploadedAssetId) },
      });
    }

    if (unlinkedAssetId) {
      await prisma.fileAsset.deleteMany({
        where: { id: BigInt(unlinkedAssetId) },
      });
    }
  });

  await t.test("POST /attachments rejects upload when no files are provided", async () => {
    const formData = new FormData();
    const res = await fetch(`${restBaseUrl}/attachments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: formData,
    });

    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.success, false);
  });

  await t.test("POST /attachments uploads file to Cloudinary and creates FileAsset", async () => {
    const formData = new FormData();
    const blob = new Blob(["Sample chat attachment content for testing"], {
      type: "text/plain",
    });
    formData.append("files", blob, "test-document.txt");

    const res = await fetch(`${restBaseUrl}/attachments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: formData,
    });

    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.assets && json.data.assets.length === 1);

    const asset = json.data.assets[0];
    uploadedAssetId = asset.assetId;
    assert.ok(uploadedAssetId);
    assert.equal(asset.originalFilename, "test-document.txt");
    assert.equal(asset.mimeType, "text/plain");
    assert.ok(asset.secureUrl);
  });

  await t.test("POST /conversations/:id/messages attaches uploaded file and infers messageType", async () => {
    const res = await fetch(
      `${restBaseUrl}/conversations/${conversationId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          content: "Here is the project specification",
          attachmentIds: [uploadedAssetId],
        }),
      },
    );

    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.messageType, "FILE");
    assert.ok(Array.isArray(json.data.attachments));
    assert.equal(json.data.attachments.length, 1);
    assert.equal(String(json.data.attachments[0].assetId), uploadedAssetId);
    assert.equal(
      json.data.attachments[0].asset.originalFilename,
      "test-document.txt",
    );
  });

  await t.test("DELETE /attachments/:id prevents deleting linked attachment", async () => {
    const res = await fetch(`${restBaseUrl}/attachments/${uploadedAssetId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.success, false);
  });

  await t.test("DELETE /attachments/:id deletes unlinked attachment successfully", async () => {
    // Upload a secondary file that will remain unlinked
    const formData = new FormData();
    const blob = new Blob(["Unlinked chat file"], { type: "text/plain" });
    formData.append("files", blob, "unlinked.txt");

    const uploadRes = await fetch(`${restBaseUrl}/attachments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: formData,
    });

    assert.equal(uploadRes.status, 201);
    const uploadJson = await uploadRes.json();
    unlinkedAssetId = uploadJson.data.assets[0].assetId;

    // Delete unlinked attachment
    const deleteRes = await fetch(
      `${restBaseUrl}/attachments/${unlinkedAssetId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
    );

    assert.equal(deleteRes.status, 200);
    const deleteJson = await deleteRes.json();
    assert.equal(deleteJson.success, true);

    // Verify asset is removed from database
    const assetInDb = await prisma.fileAsset.findUnique({
      where: { id: BigInt(unlinkedAssetId) },
    });
    assert.equal(assetInDb, null);
  });

  await t.test("DELETE /attachments/:id rejects deletion by non-owner user", async () => {
    // Member tries to delete Admin's uploaded file
    const res = await fetch(`${restBaseUrl}/attachments/${uploadedAssetId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${memberToken}`,
      },
    });

    assert.equal(res.status, 403);
  });
});
