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

test("Chat Interactions (Typing, Reactions, Pins, Read Receipts & Presence) Integration Tests", async (t) => {
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

  let clientSocketA: ClientSocketType;
  let clientSocketB: ClientSocketType;
  let conversationId: string;
  let testMessageId: string;

  // Create test conversation
  const createConvRes = await fetch(`${restBaseUrl}/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: "Interactions Test Room",
      type: "GROUP",
      participantIds: [String(memberUser.id)],
    }),
  });
  const convJson = await createConvRes.json();
  conversationId = String(convJson.data.id);

  // Send a test message
  const sendMsgRes = await fetch(
    `${restBaseUrl}/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        content: "Initial message for interactions test",
      }),
    },
  );
  const msgJson = await sendMsgRes.json();
  testMessageId = String(msgJson.data.id);

  t.after(async () => {
    clientSocketA?.disconnect();
    clientSocketB?.disconnect();
    await closeSocketServer();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));

    if (conversationId) {
      await prisma.conversation.deleteMany({
        where: { id: BigInt(conversationId) },
      });
    }
  });

  await t.test("Clients connect and register presence", async () => {
    clientSocketA = ClientSocket(socketUrl, {
      auth: { token: adminToken },
      transports: ["websocket"],
      forceNew: true,
    });

    clientSocketB = ClientSocket(socketUrl, {
      auth: { token: memberToken },
      transports: ["websocket"],
      forceNew: true,
    });

    await Promise.all([
      new Promise<void>((resolve) => clientSocketA.on("connect", resolve)),
      new Promise<void>((resolve) => clientSocketB.on("connect", resolve)),
    ]);

    assert.ok(clientSocketA.connected);
    assert.ok(clientSocketB.connected);

    // Verify REST presence endpoint
    const presenceRes = await fetch(`${restBaseUrl}/presence`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const presenceJson = await presenceRes.json();
    assert.equal(presenceRes.status, 200);
    assert.ok(Array.isArray(presenceJson.data.onlineUserIds));
    assert.ok(presenceJson.data.onlineUserIds.includes(String(adminUser.id)));
    assert.ok(presenceJson.data.onlineUserIds.includes(String(memberUser.id)));
  });

  await t.test("Clients join conversation room and broadcast typing events", async () => {
    // Both join room
    await new Promise<void>((resolve) => {
      clientSocketA.emit("chat:join", { conversationId }, () => resolve());
    });
    await new Promise<void>((resolve) => {
      clientSocketB.emit("chat:join", { conversationId }, () => resolve());
    });

    // Test typing:start
    const typingStartPromise = new Promise<{
      conversationId: string;
      userId: string;
      isTyping: boolean;
    }>((resolve) => {
      clientSocketB.once("typing:user_typing", (data) => resolve(data));
    });

    clientSocketA.emit("typing:start", { conversationId });
    const typingStartData = await typingStartPromise;

    assert.equal(typingStartData.conversationId, conversationId);
    assert.equal(typingStartData.userId, String(adminUser.id));
    assert.equal(typingStartData.isTyping, true);

    // Test typing:stop
    const typingStopPromise = new Promise<{
      conversationId: string;
      userId: string;
      isTyping: boolean;
    }>((resolve) => {
      clientSocketB.once("typing:user_typing", (data) => resolve(data));
    });

    clientSocketA.emit("typing:stop", { conversationId });
    const typingStopData = await typingStopPromise;

    assert.equal(typingStopData.conversationId, conversationId);
    assert.equal(typingStopData.userId, String(adminUser.id));
    assert.equal(typingStopData.isTyping, false);
  });

  await t.test("Client B marks message as read and Client A receives read receipt", async () => {
    const readReceiptPromise = new Promise<{
      conversationId: string;
      userId: string;
      messageId: string;
    }>((resolve) => {
      clientSocketA.once("message:read_receipt", (data) => resolve(data));
    });

    // Member marks message as read via socket
    await new Promise<void>((resolve) => {
      clientSocketB.emit(
        "message:read",
        { conversationId, messageId: testMessageId },
        (res) => {
          assert.equal(res.success, true);
          resolve();
        },
      );
    });

    const readData = await readReceiptPromise;
    assert.equal(readData.conversationId, conversationId);
    assert.equal(readData.userId, String(memberUser.id));
    assert.equal(readData.messageId, testMessageId);

    // Also verify REST endpoint works
    const restReadRes = await fetch(
      `${restBaseUrl}/conversations/${conversationId}/read`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${memberToken}`,
        },
        body: JSON.stringify({ messageId: testMessageId }),
      },
    );
    assert.equal(restReadRes.status, 200);
  });

  await t.test("Reactions: toggling emoji broadcasts update to conversation room", async () => {
    // Add reaction 👍
    const reactionAddPromise = new Promise<{
      conversationId: string;
      messageId: string;
      reactions: any[];
    }>((resolve) => {
      clientSocketA.once("message:reaction_updated", (data) => resolve(data));
    });

    const addReactionRes = await fetch(
      `${restBaseUrl}/conversations/${conversationId}/messages/${testMessageId}/reactions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${memberToken}`,
        },
        body: JSON.stringify({ emoji: "👍" }),
      },
    );
    assert.equal(addReactionRes.status, 200);
    const addJson = await addReactionRes.json();
    assert.ok(Array.isArray(addJson.data));
    assert.ok(addJson.data.some((r: any) => r.emoji === "👍"));

    const addEventData = await reactionAddPromise;
    assert.equal(addEventData.conversationId, conversationId);
    assert.equal(addEventData.messageId, testMessageId);
    assert.ok(addEventData.reactions.some((r) => r.emoji === "👍"));

    // Toggle reaction off
    const reactionRemovePromise = new Promise<{
      conversationId: string;
      messageId: string;
      reactions: any[];
    }>((resolve) => {
      clientSocketA.once("message:reaction_updated", (data) => resolve(data));
    });

    const removeReactionRes = await fetch(
      `${restBaseUrl}/conversations/${conversationId}/messages/${testMessageId}/reactions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${memberToken}`,
        },
        body: JSON.stringify({ emoji: "👍" }),
      },
    );
    assert.equal(removeReactionRes.status, 200);
    const removeJson = await removeReactionRes.json();
    assert.ok(Array.isArray(removeJson.data));
    assert.equal(removeJson.data.length, 0);

    const removeEventData = await reactionRemovePromise;
    assert.equal(removeEventData.reactions.length, 0);
  });

  await t.test("Pinning: toggling pin broadcasts update and reflects in pin list", async () => {
    // Pin message
    const pinPromise = new Promise<{
      conversationId: string;
      messageId: string;
      isPinned: boolean;
      pinnedBy?: string;
    }>((resolve) => {
      clientSocketB.once("message:pinned_updated", (data) => resolve(data));
    });

    const pinRes = await fetch(
      `${restBaseUrl}/conversations/${conversationId}/messages/${testMessageId}/pin`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );
    assert.equal(pinRes.status, 200);
    const pinJson = await pinRes.json();
    assert.equal(pinJson.data.isPinned, true);

    const pinEventData = await pinPromise;
    assert.equal(pinEventData.isPinned, true);
    assert.equal(pinEventData.messageId, testMessageId);

    // Verify GET pins endpoint
    const listPinsRes = await fetch(
      `${restBaseUrl}/conversations/${conversationId}/pins`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );
    assert.equal(listPinsRes.status, 200);
    const listPinsJson = await listPinsRes.json();
    assert.ok(Array.isArray(listPinsJson.data));
    assert.equal(listPinsJson.data.length, 1);
    assert.equal(String(listPinsJson.data[0].messageId), testMessageId);

    // Unpin message
    const unpinPromise = new Promise<{
      conversationId: string;
      messageId: string;
      isPinned: boolean;
    }>((resolve) => {
      clientSocketB.once("message:pinned_updated", (data) => resolve(data));
    });

    const unpinRes = await fetch(
      `${restBaseUrl}/conversations/${conversationId}/messages/${testMessageId}/pin`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );
    assert.equal(unpinRes.status, 200);
    const unpinJson = await unpinRes.json();
    assert.equal(unpinJson.data.isPinned, false);

    const unpinEventData = await unpinPromise;
    assert.equal(unpinEventData.isPinned, false);
  });

  await t.test("Presence disconnect broadcasts offline state", async () => {
    const presenceOfflinePromise = new Promise<{
      userId: string;
      isOnline: boolean;
    }>((resolve) => {
      clientSocketA.once("presence:state", (data) => resolve(data));
    });

    clientSocketB.disconnect();

    const offlineData = await presenceOfflinePromise;
    assert.equal(offlineData.userId, String(memberUser.id));
    assert.equal(offlineData.isOnline, false);
  });
});
