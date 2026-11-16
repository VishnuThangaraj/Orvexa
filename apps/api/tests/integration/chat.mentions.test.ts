import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import app from "../../src/app.js";
import prisma from "../../src/infrastructure/database/prisma.js";
import env from "../../src/config/env.js";
import { generateAccessToken } from "../../src/common/utils/jwt.js";
import {
  initializeSocketServer,
  closeSocketServer,
} from "../../src/sockets/socket.server.js";

test("Mandatory Fix 3: Space-Scoped @Mentions Engine", async (t) => {
  const adminUser = await prisma.user.findUnique({
    where: { email: env.ADMIN_EMAIL },
  });
  assert.ok(adminUser, "Admin user must exist");

  const memberUser = await prisma.user.findFirst({
    where: { email: "vignesh@gmail.com" },
  });
  assert.ok(memberUser, "Member user must exist");

  const outsideUser = await prisma.user.findFirst({
    where: {
      email: { notIn: [env.ADMIN_EMAIL, "vignesh@gmail.com"] },
    },
  });
  assert.ok(outsideUser, "An outside user must exist for non-member testing");

  const adminToken = generateAccessToken({
    id: adminUser.id,
    role: adminUser.role,
  });

  const memberToken = generateAccessToken({
    id: memberUser.id,
    role: memberUser.role,
  });

  const httpServer = http.createServer(app);
  initializeSocketServer(httpServer);

  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const port = (httpServer.address() as AddressInfo).port;
  const restBaseUrl = `http://127.0.0.1:${port}/api/chat`;

  let directConvId: string;
  let spaceConvId: string;

  // 1. Setup Direct Conversation
  const directRes = await fetch(`${restBaseUrl}/direct`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ recipientId: String(memberUser.id) }),
  });
  assert.equal(directRes.status, 201);
  const directData = await directRes.json();
  directConvId = String(directData.data.id);

  // 2. Setup Space (Group) Conversation with adminUser (OWNER) and memberUser (MEMBER)
  const spaceRes = await fetch(`${restBaseUrl}/conversations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Engineering Space Parity Test",
      type: "GROUP",
      participantIds: [String(memberUser.id)],
    }),
  });
  assert.equal(spaceRes.status, 201);
  const spaceData = await spaceRes.json();
  spaceConvId = String(spaceData.data.id);

  await t.test("1. Mentions are strictly rejected in 1:1 Direct Messages", async () => {
    // Attempting to pass mentionedUserIds in DM must return 400
    const failRes = await fetch(`${restBaseUrl}/conversations/${directConvId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: `Hey @${memberUser.username}`,
        mentionedUserIds: [String(memberUser.id)],
      }),
    });
    assert.equal(failRes.status, 400);
    const failBody = await failRes.json();
    assert.match(failBody.message, /Mentions are not allowed in direct messages/i);

    // Plain text @ in DM without mentionedUserIds is accepted as plain text and creates 0 mentions
    const plainTextRes = await fetch(`${restBaseUrl}/conversations/${directConvId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: `Plain text email test@example.com or @${memberUser.username}`,
      }),
    });
    assert.equal(plainTextRes.status, 201);
    const plainMsg = await plainTextRes.json();
    assert.ok(plainMsg.data.id);

    const mentionsInDb = await prisma.chatMention.count({
      where: { messageId: BigInt(plainMsg.data.id) },
    });
    assert.equal(mentionsInDb, 0, "No ChatMention should be created in direct conversation");
  });

  await t.test("2. Non-space members cannot be mentioned", async () => {
    const res = await fetch(`${restBaseUrl}/conversations/${spaceConvId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: `Hey @${outsideUser.username}`,
        mentionedUserIds: [String(outsideUser.id)],
      }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.message, /not a member of this space/i);
  });

  await t.test("3. Regular space member cannot use @all or @everyone", async () => {
    const res = await fetch(`${restBaseUrl}/conversations/${spaceConvId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${memberToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: "Hello @all urgent announcement",
        isMentionAll: true,
      }),
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.match(body.message, /Only space managers can mention @all/i);
  });

  await t.test("4. Space manager can mention @all, creating mention and notifications", async () => {
    const res = await fetch(`${restBaseUrl}/conversations/${spaceConvId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: "Attention @all release v2 is starting now!",
        isMentionAll: true,
      }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    const messageId = BigInt(body.data.id);

    const mentions = await prisma.chatMention.findMany({
      where: { messageId },
    });
    assert.equal(mentions.length, 1);
    assert.equal(mentions[0].isAll, true);

    // Verify notification was generated for the other active space participant
    const notif = await prisma.notification.findFirst({
      where: {
        userId: memberUser.id,
        referenceId: messageId,
        referenceType: "CHAT_MENTION",
      },
    });
    assert.ok(notif, "Notification should be generated for active space participant");
  });

  await t.test("5. Space member can mention another active member", async () => {
    const res = await fetch(`${restBaseUrl}/conversations/${spaceConvId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${memberToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: `Hey @${adminUser.fullName}, review this pull request please`,
        mentionedUserIds: [String(adminUser.id)],
      }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    const messageId = BigInt(body.data.id);

    const mentions = await prisma.chatMention.findMany({
      where: { messageId },
    });
    assert.equal(mentions.length, 1);
    assert.equal(mentions[0].userId, adminUser.id);
    assert.equal(mentions[0].isAll, false);

    // Verify notification for mentioned user
    const notif = await prisma.notification.findFirst({
      where: {
        userId: adminUser.id,
        referenceId: messageId,
        referenceType: "CHAT_MENTION",
      },
    });
    assert.ok(notif, "Notification should be generated for mentioned admin user");
  });

  await t.test("6. Editing message in space updates mentions and enforces direct/space rules", async () => {
    // Send a message first
    const sendRes = await fetch(`${restBaseUrl}/conversations/${spaceConvId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: `Original text with @${memberUser.username}`,
        mentionedUserIds: [String(memberUser.id)],
      }),
    });
    assert.equal(sendRes.status, 201);
    const msg = await sendRes.json();
    const messageId = msg.data.id;

    // Edit to remove mention
    const editRes = await fetch(`${restBaseUrl}/conversations/${spaceConvId}/messages/${messageId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: "Updated message without any mentions",
        mentionedUserIds: [],
        isMentionAll: false,
      }),
    });
    assert.equal(editRes.status, 200);

    const countAfter = await prisma.chatMention.count({
      where: { messageId: BigInt(messageId) },
    });
    assert.equal(countAfter, 0, "Mentions should be cleared on edit");
  });

  await t.test("7. Querying conversations with hasMentions=true filters by mentions", async () => {
    // Send another mention message targeting memberUser
    await fetch(`${restBaseUrl}/conversations/${spaceConvId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: `Hey @${memberUser.username} test mentions query`,
        mentionedUserIds: [String(memberUser.id)],
      }),
    });

    const queryRes = await fetch(`${restBaseUrl}/conversations?hasMentions=true`, {
      headers: {
        Authorization: `Bearer ${memberToken}`,
      },
    });
    assert.equal(queryRes.status, 200);
    const queryData = await queryRes.json();
    assert.ok(queryData.data.conversations.length > 0);
    const found = queryData.data.conversations.some(
      (c: any) => String(c.id) === spaceConvId,
    );
    assert.ok(found, "Space with mentions must appear in hasMentions query");
  });

  t.after(async () => {
    await closeSocketServer();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });
});
