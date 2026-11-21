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

test("Task 3.4: In-Line Threading & Parent-Reply Architecture Tests", async (t) => {
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

  let clientSocketA: ClientSocketType | null = null;
  let clientSocketB: ClientSocketType | null = null;
  let conversationId: string | null = null;
  let rootMessageId: string;
  let replyMessageId: string;

  try {
    // Setup: create test space with admin and member
    const convRes = await fetch(`${restBaseUrl}/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        type: "GROUP",
        name: "Threading Test Space",
        participantIds: [String(memberUser.id)],
      }),
    });
    assert.equal(convRes.status, 201);
    const convJson = (await convRes.json()) as any;
    conversationId = String(convJson.data.id);

    // Connect sockets
    clientSocketA = ClientSocket(socketUrl, {
      auth: { token: adminToken },
      transports: ["websocket"],
    });

    clientSocketB = ClientSocket(socketUrl, {
      auth: { token: memberToken },
      transports: ["websocket"],
    });

    await Promise.all([
      new Promise<void>((resolve) => clientSocketA!.on("connect", () => resolve())),
      new Promise<void>((resolve) => clientSocketB!.on("connect", () => resolve())),
    ]);

    // Join conversation rooms
    await new Promise<void>((resolve) => {
      clientSocketA!.emit("chat:join", { conversationId }, () => resolve());
    });
    await new Promise<void>((resolve) => {
      clientSocketB!.emit("chat:join", { conversationId }, () => resolve());
    });

    await t.test("1. Root message creation without parentMessageId", async () => {
      const receivePromise = new Promise<any>((resolve) => {
        clientSocketB!.once("message:received", (data) => resolve(data));
      });

      clientSocketA!.emit("chat:send", {
        conversationId,
        content: "This is the root message of the thread",
      });

      const received = await receivePromise;
      assert.equal(received.content, "This is the root message of the thread");
      assert.equal(received.parentMessageId, null);
      rootMessageId = String(received.id);
    });

    await t.test("2. Replying in thread with parentMessageId creates linked child message", async () => {
      const receivePromise = new Promise<any>((resolve) => {
        clientSocketA!.once("message:received", (data) => resolve(data));
      });

      clientSocketB!.emit("chat:send", {
        conversationId,
        content: "This is a reply message inside the thread",
        parentMessageId: rootMessageId,
      });

      const received = await receivePromise;
      assert.equal(received.content, "This is a reply message inside the thread");
      assert.equal(String(received.parentMessageId), String(rootMessageId));
      assert.ok(received.parentMessage, "Parent message relation must be populated");
      assert.equal(received.parentMessage.content, "This is the root message of the thread");
      replyMessageId = String(received.id);
    });

    await t.test("3. History queries return root messages with replies count and thread replies correctly", async () => {
      // 3a. Root messages query
      const rootRes = await fetch(
        `${restBaseUrl}/conversations/${conversationId}/messages`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );
      assert.equal(rootRes.status, 200);
      const rootJson = (await rootRes.json()) as any;
      const rootMessages = rootJson.data;

      const rootMsg = rootMessages.find((m: any) => String(m.id) === String(rootMessageId));
      assert.ok(rootMsg, "Root message must be present in root messages query");
      assert.equal(rootMsg.parentMessageId, null);
      assert.equal(rootMsg._count?.replies, 1, "Root message must have replies count equal to 1");

      // 3b. Thread replies query
      const threadRes = await fetch(
        `${restBaseUrl}/conversations/${conversationId}/messages?parentMessageId=${rootMessageId}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );
      assert.equal(threadRes.status, 200);
      const threadJson = (await threadRes.json()) as any;
      const threadReplies = threadJson.data;

      const replyMsg = threadReplies.find((m: any) => String(m.id) === String(replyMessageId));
      assert.ok(replyMsg, "Reply message must be present in thread replies query");
      assert.equal(String(replyMsg.parentMessageId), String(rootMessageId));
      assert.ok(replyMsg.parentMessage, "Parent message relation must be populated on reply");
      assert.equal(String(replyMsg.parentMessage.id), String(rootMessageId));

      // 3c. All messages query (parentMessageId=all returns both root and replies)
      const allRes = await fetch(
        `${restBaseUrl}/conversations/${conversationId}/messages?parentMessageId=all`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );
      assert.equal(allRes.status, 200);
      const allJson = (await allRes.json()) as any;
      const allMessages = allJson.data;

      assert.ok(
        allMessages.some((m: any) => String(m.id) === String(rootMessageId)),
        "Root message must be present in all messages query",
      );
      assert.ok(
        allMessages.some((m: any) => String(m.id) === String(replyMessageId)),
        "Reply message must be present in all messages query",
      );
    });

    await t.test("4. Soft deleting root message leaves tombstone and preserves thread replies", async () => {
      const deleteRes = await fetch(
        `${restBaseUrl}/conversations/${conversationId}/messages/${rootMessageId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );
      assert.equal(deleteRes.status, 200);

      // Verify root message tombstone
      const rootRes = await fetch(
        `${restBaseUrl}/conversations/${conversationId}/messages`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );
      const rootJson = (await rootRes.json()) as any;
      const deletedRoot = rootJson.data.find((m: any) => String(m.id) === String(rootMessageId));
      assert.ok(deletedRoot, "Deleted root message remains as tombstone");
      assert.ok(deletedRoot.deletedAt, "deletedAt timestamp must be populated on tombstone");

      // Verify replies remain intact
      const threadRes = await fetch(
        `${restBaseUrl}/conversations/${conversationId}/messages?parentMessageId=${rootMessageId}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );
      const threadJson = (await threadRes.json()) as any;
      const replyMsg = threadJson.data.find((m: any) => String(m.id) === String(replyMessageId));
      assert.ok(replyMsg, "Reply message must remain intact in thread");
      assert.equal(replyMsg.deletedAt, null);
    });
  } finally {
    // Guaranteed cleanup
    if (clientSocketA) clientSocketA.disconnect();
    if (clientSocketB) clientSocketB.disconnect();
    closeSocketServer();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));

    if (conversationId) {
      await prisma.conversation.delete({
        where: { id: BigInt(conversationId) },
      }).catch(() => {});
    }
  }
});
