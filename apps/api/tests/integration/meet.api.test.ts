import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import app from "../../src/app.js";
import { prisma } from "../../src/config/prisma.js";
import env from "../../src/config/env.js";
import { generateAccessToken } from "../../src/common/utils/jwt.js";

test("Meet REST API & LiveKit Token Issuance Integration Tests", async (t) => {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));

  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}/api/meet`;

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

  const cleanupMeetingIds: bigint[] = [];

  t.after(async () => {
    if (cleanupMeetingIds.length > 0) {
      await prisma.meetingMessage.deleteMany({
        where: { meetingId: { in: cleanupMeetingIds } },
      });
      await prisma.meetingParticipant.deleteMany({
        where: { meetingId: { in: cleanupMeetingIds } },
      });
      await prisma.meeting.deleteMany({
        where: { id: { in: cleanupMeetingIds } },
      });
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  let createdCode = "";
  let createdMeetingId = "";

  await t.test("1. POST /api/meet - Create instant meeting as host", async () => {
    const res = await fetch(`${baseUrl}`, {
      method: "POST",
      headers: {
        "Content-TransType": "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: "Test Sync Meeting",
        requireApproval: true,
      }),
    });

    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.meetingCode);
    assert.match(json.data.meetingCode, /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/);
    assert.equal(json.data.myRole, "HOST");
    assert.equal(json.data.requireApproval, true);

    createdCode = json.data.meetingCode;
    createdMeetingId = json.data.id;
    cleanupMeetingIds.push(BigInt(createdMeetingId));
  });

  await t.test("2. GET /api/meet/:code - Retrieve meeting details", async () => {
    const res = await fetch(`${baseUrl}/${createdCode}`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.meetingCode, createdCode);
    assert.equal(json.data.host.id, String(adminUser.id));
  });

  await t.test("3. GET /api/meet - List user meetings", async () => {
    const res = await fetch(`${baseUrl}`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data));
    const found = json.data.find((m: any) => m.meetingCode === createdCode);
    assert.ok(found, "Newly created meeting must appear in user meetings list");
  });

  await t.test("4. POST /api/meet/:code/token - Host gets token immediately", async () => {
    const res = await fetch(`${baseUrl}/${createdCode}/token`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.token, "LiveKit JWT token must be returned");
    assert.equal(json.data.meetingCode, createdCode);
    assert.equal(json.data.role, "HOST");
    assert.equal(json.data.participantId, String(adminUser.id));
  });

  await t.test("5. Waiting room enforcement: Non-admitted participant rejected until admitted", async () => {
    // Member tries to get token without being admitted -> 403 Forbidden
    const resRejected = await fetch(`${baseUrl}/${createdCode}/token`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${memberToken}`,
      },
    });

    assert.equal(resRejected.status, 403);

    // Host admits member
    const resAdmit = await fetch(`${baseUrl}/${createdCode}/admit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        userId: String(memberUser.id),
      }),
    });

    assert.equal(resAdmit.status, 200);

    // Member tries to get token again -> 200 OK
    const resAccepted = await fetch(`${baseUrl}/${createdCode}/token`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${memberToken}`,
      },
    });

    assert.equal(resAccepted.status, 200);
    const json = await resAccepted.json();
    assert.ok(json.data.token);
    assert.equal(json.data.role, "PARTICIPANT");
  });

  await t.test("6. In-call messages: Send and list messages", async () => {
    const resSend = await fetch(`${baseUrl}/${createdCode}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        content: "Hello everyone in the meeting!",
      }),
    });

    assert.equal(resSend.status, 201);
    const sendJson = await resSend.json();
    assert.equal(sendJson.data.content, "Hello everyone in the meeting!");

    const resList = await fetch(`${baseUrl}/${createdCode}/messages`, {
      headers: {
        Authorization: `Bearer ${memberToken}`,
      },
    });

    assert.equal(resList.status, 200);
    const listJson = await resList.json();
    assert.ok(Array.isArray(listJson.data));
    assert.equal(listJson.data.length, 1);
    assert.equal(listJson.data[0].content, "Hello everyone in the meeting!");
  });

  await t.test("7. Host controls & End meeting for everyone", async () => {
    // Non-host attempts settings update -> 403
    const resForbidden = await fetch(`${baseUrl}/${createdCode}/settings`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({
        isLocked: true,
      }),
    });
    assert.equal(resForbidden.status, 403);

    // Host updates settings -> 200
    const resSettings = await fetch(`${baseUrl}/${createdCode}/settings`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        isLocked: true,
      }),
    });
    assert.equal(resSettings.status, 200);
    const settingsJson = await resSettings.json();
    assert.equal(settingsJson.data.isLocked, true);

    // Host ends meeting
    const resEnd = await fetch(`${baseUrl}/${createdCode}/end`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    assert.equal(resEnd.status, 200);
    const endJson = await resEnd.json();
    assert.equal(endJson.data.status, "ENDED");

    // Token issuance fails after meeting ended -> 410 Gone
    const resTokenAfterEnd = await fetch(`${baseUrl}/${createdCode}/token`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    assert.equal(resTokenAfterEnd.status, 410);
  });
});
