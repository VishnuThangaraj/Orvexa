import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import sharp from "sharp";
import app from "../../src/app.js";
import prisma from "../../src/infrastructure/database/prisma.js";
import env from "../../src/config/env.js";
import { generateAccessToken } from "../../src/common/utils/jwt.js";

test("Profile REST API Integration Tests", async (t) => {
  const adminUser = await prisma.user.findUnique({
    where: { email: env.ADMIN_EMAIL },
    include: { preferences: true },
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

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}/api/profile`;

  const originalState = {
    fullName: adminUser.fullName,
    username: adminUser.username,
    email: adminUser.email,
    phone: adminUser.phone,
    dob: adminUser.dob,
    gender: adminUser.gender,
    address: adminUser.address,
    profileImageId: adminUser.profileImageId,
    preferences: adminUser.preferences
      ? {
          theme: adminUser.preferences.theme,
          language: adminUser.preferences.language,
          timezone: adminUser.preferences.timezone,
          notificationPreferences: adminUser.preferences.notificationPreferences,
        }
      : null,
  };

  t.after(async () => {
    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        fullName: originalState.fullName,
        username: originalState.username,
        email: originalState.email,
        phone: originalState.phone,
        dob: originalState.dob,
        gender: originalState.gender,
        address: originalState.address,
        profileImageId: originalState.profileImageId,
      },
    });

    if (originalState.preferences) {
      await prisma.userPreference.upsert({
        where: { userId: adminUser.id },
        create: {
          userId: adminUser.id,
          theme: originalState.preferences.theme,
          language: originalState.preferences.language,
          timezone: originalState.preferences.timezone,
          notificationPreferences:
            originalState.preferences.notificationPreferences ?? undefined,
        },
        update: {
          theme: originalState.preferences.theme,
          language: originalState.preferences.language,
          timezone: originalState.preferences.timezone,
          notificationPreferences:
            originalState.preferences.notificationPreferences ?? undefined,
        },
      });
    }

    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  await t.test("GET /api/profile rejects unauthenticated request with 401", async () => {
    const res = await fetch(baseUrl);
    assert.equal(res.status, 401);
  });

  await t.test("GET /api/profile returns authenticated user profile", async () => {
    const res = await fetch(baseUrl, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.email, adminUser.email);
    assert.equal(json.data.username, adminUser.username);
    assert.equal(typeof json.data.activeSessionsCount, "number");
    assert.equal(json.data.credentials?.passwordHash, undefined);
  });

  await t.test("GET /api/profile/username-availability checks uniqueness accurately", async () => {
    const ownRes = await fetch(
      `${baseUrl}/username-availability?username=${encodeURIComponent(adminUser.username)}`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    assert.equal(ownRes.status, 200);
    const ownJson = await ownRes.json();
    assert.equal(ownJson.data.available, true);

    const takenRes = await fetch(
      `${baseUrl}/username-availability?username=${encodeURIComponent(memberUser.username)}`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    assert.equal(takenRes.status, 200);
    const takenJson = await takenRes.json();
    assert.equal(takenJson.data.available, false);
  });

  await t.test("PATCH /api/profile updates basic & contact fields and rejects conflicts", async () => {
    const updateRes = await fetch(baseUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        fullName: "Vishnu T Updated",
        phone: "+91 9876501234",
        dob: "1998-04-12",
        gender: "Male",
        address: "Bengaluru, India",
      }),
    });

    assert.equal(updateRes.status, 200);
    const updateJson = await updateRes.json();
    assert.equal(updateJson.success, true);
    assert.equal(updateJson.data.fullName, "Vishnu T Updated");
    assert.equal(updateJson.data.phone, "+91 9876501234");
    assert.equal(updateJson.data.gender, "Male");
    assert.equal(updateJson.data.address, "Bengaluru, India");
    assert.ok(String(updateJson.data.dob).startsWith("1998-04-12"));

    // Conflict on duplicate username
    const conflictRes = await fetch(baseUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        username: memberUser.username,
      }),
    });
    assert.equal(conflictRes.status, 409);

    // Validation error on empty payload
    const invalidRes = await fetch(baseUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({}),
    });
    assert.equal(invalidRes.status, 400);
  });

  await t.test("PATCH /api/profile/preferences upserts theme, timezone & notifications", async () => {
    const res = await fetch(`${baseUrl}/preferences`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        theme: "dark",
        language: "en",
        timezone: "Asia/Kolkata",
        notificationPreferences: {
          mail: true,
          chat: false,
          calendar: true,
          security: true,
        },
      }),
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.theme, "dark");
    assert.equal(json.data.timezone, "Asia/Kolkata");
    assert.equal(json.data.notificationPreferences.chat, false);
  });

  await t.test("POST /api/profile/photo validates, uploads and DELETE removes profile photo", async () => {
    // Reject empty upload
    const emptyForm = new FormData();
    const emptyRes = await fetch(`${baseUrl}/photo`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: emptyForm,
    });
    assert.equal(emptyRes.status, 400);

    // Reject corrupted image bytes
    const corruptForm = new FormData();
    corruptForm.append(
      "photo",
      new Blob(["not a real png image"], { type: "image/png" }),
      "corrupt.png",
    );
    const corruptRes = await fetch(`${baseUrl}/photo`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: corruptForm,
    });
    assert.equal(corruptRes.status, 400);

    // Upload valid PNG created via sharp
    const pngBuffer = await sharp({
      create: {
        width: 64,
        height: 64,
        channels: 3,
        background: { r: 11, g: 87, b: 208 },
      },
    })
      .png()
      .toBuffer();

    const validForm = new FormData();
    validForm.append(
      "photo",
      new Blob([new Uint8Array(pngBuffer)], { type: "image/png" }),
      "avatar.png",
    );

    const uploadRes = await fetch(`${baseUrl}/photo`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: validForm,
    });

    assert.equal(uploadRes.status, 200);
    const uploadJson = await uploadRes.json();
    assert.equal(uploadJson.success, true);
    assert.ok(uploadJson.data.profileImage?.id);
    assert.ok(uploadJson.data.profileImage?.secureUrl);

    const uploadedAssetId = BigInt(uploadJson.data.profileImage.id);

    // Remove photo
    const deleteRes = await fetch(`${baseUrl}/photo`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.equal(deleteRes.status, 200);
    const deleteJson = await deleteRes.json();
    assert.equal(deleteJson.success, true);
    assert.equal(deleteJson.data.profileImage, null);
    assert.equal(deleteJson.data.profileImageId, null);

    const deletedAsset = await prisma.fileAsset.findUnique({
      where: { id: uploadedAssetId },
    });
    assert.equal(deletedAsset, null);
  });
});
