import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import app from "../../src/app.js";
import { prisma } from "../../src/config/prisma.js";
import env from "../../src/config/env.js";
import { generateAccessToken } from "../../src/common/utils/jwt.js";

test("Mail Thread Retrieval & State API Integration Tests", async (t) => {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));

  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}/api/mail`;

  const adminUser = await prisma.user.findUnique({
    where: { email: env.ADMIN_EMAIL },
  });
  assert.ok(adminUser, "Admin user must exist");

  const memberUser = await prisma.user.findFirst({
    where: { email: "vignesh@gmail.com" },
  });
  assert.ok(memberUser, "Member user must exist");

  const outsiderUser = await prisma.user.findFirst({
    where: {
      email: { notIn: [env.ADMIN_EMAIL, "vignesh@gmail.com"] },
      isActive: true,
    },
  });
  assert.ok(outsiderUser, "Outsider user must exist");

  const adminToken = generateAccessToken({
    id: adminUser.id,
    role: adminUser.role,
  });

  const memberToken = generateAccessToken({
    id: memberUser.id,
    role: memberUser.role,
  });

  const outsiderToken = generateAccessToken({
    id: outsiderUser.id,
    role: outsiderUser.role,
  });

  const createdMessageIds: bigint[] = [];

  t.after(async () => {
    if (createdMessageIds.length > 0) {
      await prisma.mailUserState.deleteMany({
        where: { messageId: { in: createdMessageIds } },
      });
      await prisma.mailRecipient.deleteMany({
        where: { messageId: { in: createdMessageIds } },
      });
      await prisma.mailAttachment.deleteMany({
        where: { messageId: { in: createdMessageIds } },
      });
      await prisma.mailMessage.deleteMany({
        where: { id: { in: createdMessageIds } },
      });
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  let parentMessageId = "";
  let replyMessageId = "";
  let threadId = "";

  await t.test("1. GET /api/mail/threads/:threadId validates input params", async () => {
    const res = await fetch(`${baseUrl}/threads/invalid-id`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await t.test("2. GET /api/mail/threads/:threadId returns 404 for non-existent thread", async () => {
    const res = await fetch(`${baseUrl}/threads/999999999`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await t.test("3. Send root message from admin to member", async () => {
    const res = await fetch(`${baseUrl}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        to: memberUser.email,
        subject: "Thread Test Subject: Onboarding Update",
        body: "Hello Vignesh, this is the first message in our new conversation thread.",
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data?.id);

    parentMessageId = body.data.id.toString();
    threadId = body.data.threadId ? body.data.threadId.toString() : parentMessageId;
    createdMessageIds.push(BigInt(parentMessageId));
  });

  await t.test("4. Member fetches thread and auto-marks message as read", async () => {
    const res = await fetch(`${baseUrl}/threads/${parentMessageId}`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.messageCount, 1);
    assert.equal(body.data.subject, "Thread Test Subject: Onboarding Update");
    assert.equal(body.data.messages[0].id, parentMessageId);
    assert.equal(body.data.messages[0].isRead, true);

    // Verify in database that member's userState is indeed marked read
    const userState = await prisma.mailUserState.findUnique({
      where: {
        messageId_userId: {
          messageId: BigInt(parentMessageId),
          userId: memberUser.id,
        },
      },
    });
    assert.ok(userState);
    assert.equal(userState.isRead, true);
    assert.ok(userState.readAt);
  });

  await t.test("5. Member sends reply to thread with parentMessageId", async () => {
    const res = await fetch(`${baseUrl}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({
        to: adminUser.email,
        subject: "Re: Thread Test Subject: Onboarding Update",
        body: "Thank you for the update! Here is my reply in the thread.",
        parentMessageId,
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data?.id);

    replyMessageId = body.data.id.toString();
    createdMessageIds.push(BigInt(replyMessageId));
    assert.equal(body.data.parentMessageId, parentMessageId);
  });

  await t.test("6. Admin fetches full conversation thread with both messages in chronological order", async () => {
    const res = await fetch(`${baseUrl}/threads/${threadId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.messageCount, 2);
    assert.equal(body.data.messages[0].id, parentMessageId);
    assert.equal(body.data.messages[1].id, replyMessageId);
    assert.equal(body.data.messages[1].sender.email, memberUser.email);
  });

  await t.test("7. PATCH /api/mail/messages/:id/state updates star and archive status", async () => {
    const res = await fetch(`${baseUrl}/messages/${parentMessageId}/state`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        isStarred: true,
        isArchived: true,
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.isStarred, true);
    assert.equal(body.data.isArchived, true);
  });

  await t.test("8. POST /api/mail/messages/batch-state updates multiple messages", async () => {
    const res = await fetch(`${baseUrl}/messages/batch-state`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        messageIds: [parentMessageId, replyMessageId],
        isRead: false,
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
  });

  await t.test("9. Non-participant user is forbidden (403) from accessing thread", async () => {
    const res = await fetch(`${baseUrl}/threads/${threadId}`, {
      headers: { Authorization: `Bearer ${outsiderToken}` },
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
  });
});
