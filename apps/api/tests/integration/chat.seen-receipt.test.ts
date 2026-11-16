import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { io as ClientSocket, type Socket as ClientSocketType } from "socket.io-client";
import app from "../../src/app.js";
import prisma from "../../src/infrastructure/database/prisma.js";
import env from "../../src/config/env.js";
import { generateAccessToken } from "../../src/common/utils/jwt.js";
import {
  initializeSocketServer,
  closeSocketServer,
} from "../../src/sockets/socket.server.js";

test("Mandatory Fix 2: Message Seen Status & Read Receipt Verification", async (t) => {
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
  initializeSocketServer(httpServer);

  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const port = (httpServer.address() as AddressInfo).port;
  const socketUrl = `http://127.0.0.1:${port}`;
  const restBaseUrl = `http://127.0.0.1:${port}/api/chat`;

  let senderSocket: ClientSocketType;
  let recipientSocket: ClientSocketType;
  let directConvId: string;
  let sentMessageId: string;

  // Resolve or create direct conversation between adminUser and memberUser
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

  // Connect sockets
  senderSocket = ClientSocket(socketUrl, {
    auth: { token: adminToken },
    transports: ["websocket"],
  });

  recipientSocket = ClientSocket(socketUrl, {
    auth: { token: memberToken },
    transports: ["websocket"],
  });

  await Promise.all([
    new Promise<void>((resolve) => senderSocket.on("connect", resolve)),
    new Promise<void>((resolve) => recipientSocket.on("connect", resolve)),
  ]);

  // Both join the conversation room
  await new Promise<void>((resolve) => {
    senderSocket.emit("chat:join", { conversationId: directConvId }, () => resolve());
  });
  await new Promise<void>((resolve) => {
    recipientSocket.emit("chat:join", { conversationId: directConvId }, () => resolve());
  });

  await t.test("1. Outgoing message is sent and NOT marked as seen by recipient initially", async () => {
    const sendRes = await fetch(`${restBaseUrl}/conversations/${directConvId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: "Hello recipient, can you see this?" }),
    });
    assert.equal(sendRes.status, 201);
    const sendData = await sendRes.json();
    sentMessageId = String(sendData.data.id);

    // Fetch conversation details to inspect participant read cursors
    const detailsRes = await fetch(`${restBaseUrl}/conversations/${directConvId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const detailsData = await detailsRes.json();
    const recipientParticipant = detailsData.data.participants.find(
      (p: any) => String(p.userId) === String(memberUser.id),
    );

    // Recipient has not read the message yet
    const isSeenByRecipient = recipientParticipant?.lastReadMessageId
      ? BigInt(recipientParticipant.lastReadMessageId) >= BigInt(sentMessageId)
      : false;

    assert.equal(
      isSeenByRecipient,
      false,
      "New outgoing message must NOT be marked as seen by recipient immediately after sending",
    );
  });

  await t.test("2. Sender calling markAsRead does not mark outgoing message as seen by other participants", async () => {
    // Sender emits message:read (e.g. from an erroneous echo or own activity)
    await new Promise<void>((resolve) => {
      senderSocket.emit(
        "message:read",
        { conversationId: directConvId, messageId: sentMessageId },
        () => resolve(),
      );
    });

    // Check recipient read cursor again
    const detailsRes = await fetch(`${restBaseUrl}/conversations/${directConvId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const detailsData = await detailsRes.json();
    const recipientParticipant = detailsData.data.participants.find(
      (p: any) => String(p.userId) === String(memberUser.id),
    );

    const isSeenByRecipient = recipientParticipant?.lastReadMessageId
      ? BigInt(recipientParticipant.lastReadMessageId) >= BigInt(sentMessageId)
      : false;

    assert.equal(
      isSeenByRecipient,
      false,
      "Sender updating own read cursor must NOT advance recipient's read cursor or mark outgoing message as seen",
    );
  });

  await t.test("3. When recipient views and marks as read, seen receipt is broadcast and message becomes seen", async () => {
    // Listen for read receipt on sender socket
    const readReceiptPromise = new Promise<any>((resolve) => {
      senderSocket.on("message:read_receipt", (data) => {
        resolve(data);
      });
    });

    // Recipient reads the message
    await new Promise<void>((resolve) => {
      recipientSocket.emit(
        "message:read",
        { conversationId: directConvId, messageId: sentMessageId },
        () => resolve(),
      );
    });

    const receiptData = await readReceiptPromise;
    assert.equal(String(receiptData.conversationId), directConvId);
    assert.equal(String(receiptData.userId), String(memberUser.id));
    assert.equal(String(receiptData.messageId), sentMessageId);

    // Fetch conversation details and verify seen status
    const detailsRes = await fetch(`${restBaseUrl}/conversations/${directConvId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const detailsData = await detailsRes.json();
    const recipientParticipant = detailsData.data.participants.find(
      (p: any) => String(p.userId) === String(memberUser.id),
    );

    const isSeenByRecipient = recipientParticipant?.lastReadMessageId
      ? BigInt(recipientParticipant.lastReadMessageId) >= BigInt(sentMessageId)
      : false;

    assert.equal(
      isSeenByRecipient,
      true,
      "Message must be marked as seen after recipient read cursor advances past the message ID",
    );
  });

  t.after(async () => {
    senderSocket?.disconnect();
    recipientSocket?.disconnect();
    await closeSocketServer();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));

    // Cleanup test conversation messages
    if (directConvId) {
      await prisma.chatMessage.deleteMany({
        where: { conversationId: BigInt(directConvId) },
      });
    }
  });
});
