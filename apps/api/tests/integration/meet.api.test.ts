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
  const cleanupMeetingIds: bigint[] = [];

  t.after(async () => {
    if (cleanupMeetingIds.length > 0) {
      await prisma.auditLog.deleteMany({
        where: {
          entityType: "MEET_SIGNAL",
          entityId: { in: cleanupMeetingIds },
        },
      });
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
    assert.ok(
      json.data.mode === "livekit" || json.data.mode === "webrtc",
      "Token response must declare media mode (livekit or webrtc)",
    );
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

    // Member knocks via HTTP waiting-room fallback -> PENDING
    const resKnock = await fetch(`${baseUrl}/${createdCode}/knock`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({ displayName: memberUser.fullName }),
    });
    assert.equal(resKnock.status, 200);
    const knockJson = await resKnock.json();
    assert.equal(knockJson.data.status, "PENDING");

    // Host polls signals/roster and sees member in waitingParticipants
    const resHostSignals = await fetch(`${baseUrl}/${createdCode}/signals`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(resHostSignals.status, 200);
    const hostSignalsJson = await resHostSignals.json();
    assert.ok(
      hostSignalsJson.data.waitingParticipants.some(
        (p: any) => p.userId === String(memberUser.id),
      ),
      "Waiting participant should appear in host signals response",
    );

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

  await t.test("6b. WebRTC Signaling: Post offer, poll with afterId cursor, and leave", async () => {
    // Member sends WebRTC SDP offer targeted to host
    const resOffer = await fetch(`${baseUrl}/${createdCode}/signal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({
        toUserId: String(adminUser.id),
        kind: "offer",
        payload: { sdp: { type: "offer", sdp: "v=0\r\no=- 123 2 IN IP4 127.0.0.1\r\n" } },
      }),
    });
    assert.equal(resOffer.status, 201);
    const offerJson = await resOffer.json();
    assert.equal(offerJson.data.kind, "offer");
    assert.equal(offerJson.data.fromUserId, String(memberUser.id));

    // Host polls signals and sees offer + both active participants
    const resPoll = await fetch(`${baseUrl}/${createdCode}/signals`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(resPoll.status, 200);
    const pollJson = await resPoll.json();
    assert.ok(pollJson.data.signals.some((s: any) => s.kind === "offer" && s.fromUserId === String(memberUser.id)));
    assert.ok(pollJson.data.activeParticipants.some((p: any) => p.userId === String(adminUser.id)));
    assert.ok(pollJson.data.activeParticipants.some((p: any) => p.userId === String(memberUser.id)));
    assert.ok(pollJson.data.latestId);

    // Polling again with afterId excludes already-seen signals
    const resPoll2 = await fetch(
      `${baseUrl}/${createdCode}/signals?afterId=${encodeURIComponent(pollJson.data.latestId)}`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    assert.equal(resPoll2.status, 200);
    const pollJson2 = await resPoll2.json();
    assert.equal(pollJson2.data.signals.length, 0);

    // Member leaves meeting -> emits leave signal and updates activeParticipants
    const resLeave = await fetch(`${baseUrl}/${createdCode}/leave`, {
      method: "POST",
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    assert.equal(resLeave.status, 200);

    const resPoll3 = await fetch(
      `${baseUrl}/${createdCode}/signals?afterId=${encodeURIComponent(pollJson.data.latestId)}`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    assert.equal(resPoll3.status, 200);
    const pollJson3 = await resPoll3.json();
    assert.ok(pollJson3.data.signals.some((s: any) => s.kind === "leave" && s.fromUserId === String(memberUser.id)));
    assert.ok(!pollJson3.data.activeParticipants.some((p: any) => p.userId === String(memberUser.id)));
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
