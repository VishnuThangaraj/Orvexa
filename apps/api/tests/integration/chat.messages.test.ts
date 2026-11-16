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

test("Chat Messaging Real-Time Engine & History Integration Tests", async (t) => {
  const adminUser = await prisma.user.findUnique({
    where: { email: env.ADMIN_EMAIL },
  });
  assert.ok(adminUser, "Admin user must exist");

  const memberUser = await prisma.user.findFirst({
    where: { email: "vignesh@gmail.com" },
  });
  assert.ok(memberUser, "Member user must exist");

  const thirdUser = await prisma.user.findFirst({
    where: { email: "thilakeshwaran@gmail.com" },
  });
  assert.ok(thirdUser, "Third user must exist");

  const adminToken = generateAccessToken({
    id: adminUser.id,
    role: adminUser.role,
  });

  const memberToken = generateAccessToken({
    id: memberUser.id,
    role: memberUser.role,
  });

  const thirdUserToken = generateAccessToken({
    id: thirdUser.id,
    role: thirdUser.role,
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
  let sentMessageId: string;

  // Create test group conversation
  const createConvRes = await fetch(`${restBaseUrl}/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: "Realtime Chat Test Room",
      type: "GROUP",
      participantIds: [String(memberUser.id)],
    }),
  });
  const convJson = await createConvRes.json();
  conversationId = String(convJson.data.id);

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

  // Connect client sockets for Admin and Member
  await t.test("Both users connect their WebSocket clients", async () => {
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
      new Promise<void>((resolve, reject) => {
        clientSocketA.on("connect", () => resolve());
        clientSocketA.on("connect_error", reject);
      }),
      new Promise<void>((resolve, reject) => {
        clientSocketB.on("connect", () => resolve());
        clientSocketB.on("connect_error", reject);
      }),
    ]);

    assert.equal(clientSocketA.connected, true);
    assert.equal(clientSocketB.connected, true);
  });

  await t.test("Both users join the conversation room", async () => {
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        clientSocketA.emit(
          "chat:join",
          { conversationId },
          (res: { success: boolean; error?: string }) => {
            if (res.success) resolve();
            else reject(new Error(res.error));
          },
        );
      }),
      new Promise<void>((resolve, reject) => {
        clientSocketB.emit(
          "chat:join",
          { conversationId },
          (res: { success: boolean; error?: string }) => {
            if (res.success) resolve();
            else reject(new Error(res.error));
          },
        );
      }),
    ]);
  });

  await t.test(
    "User A sends message via socket and User B receives message in real time",
    async () => {
      const messagePromise = new Promise<any>((resolve) => {
        clientSocketB.on("message:received", (msg: any) => {
          resolve(msg);
        });
      });

      const ackPromise = new Promise<any>((resolve, reject) => {
        clientSocketA.emit(
          "chat:send",
          {
            conversationId,
            content: "Hello from Socket A!",
            messageType: "TEXT",
          },
          (res: { success: boolean; data?: any; error?: string }) => {
            if (res.success) resolve(res.data);
            else reject(new Error(res.error));
          },
        );
      });

      const [receivedMessage, ackMessage] = await Promise.all([
        messagePromise,
        ackPromise,
      ]);

      assert.equal(ackMessage.content, "Hello from Socket A!");
      assert.equal(receivedMessage.content, "Hello from Socket A!");
      assert.equal(String(receivedMessage.sender.id), String(adminUser.id));

      sentMessageId = String(ackMessage.id);
    },
  );

  await t.test(
    "User B replies via REST API and User A receives message via socket broadcast",
    async () => {
      const messagePromise = new Promise<any>((resolve) => {
        clientSocketA.on("message:received", (msg: any) => {
          resolve(msg);
        });
      });

      const res = await fetch(
        `${restBaseUrl}/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${memberToken}`,
          },
          body: JSON.stringify({
            content: "Reply from Member via REST",
            parentMessageId: sentMessageId,
          }),
        },
      );

      assert.equal(res.status, 201);
      const restJson = await res.json();
      assert.equal(restJson.success, true);
      assert.equal(String(restJson.data.parentMessageId), sentMessageId);

      const socketBroadcast = await messagePromise;
      assert.equal(socketBroadcast.content, "Reply from Member via REST");
      assert.equal(String(socketBroadcast.parentMessageId), sentMessageId);
    },
  );

  await t.test(
    "User A edits message and User B receives message:updated event in real time",
    async () => {
      const updatePromise = new Promise<any>((resolve) => {
        clientSocketB.on("message:updated", (msg: any) => {
          resolve(msg);
        });
      });

      const res = await fetch(
        `${restBaseUrl}/conversations/${conversationId}/messages/${sentMessageId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            content: "Hello from Socket A! (Edited content)",
          }),
        },
      );

      assert.equal(res.status, 200);
      const updatedRest = await res.json();
      assert.equal(updatedRest.data.content, "Hello from Socket A! (Edited content)");
      assert.equal(updatedRest.data.isEdited, true);

      const updatedSocket = await updatePromise;
      assert.equal(
        updatedSocket.content,
        "Hello from Socket A! (Edited content)",
      );
      assert.equal(updatedSocket.isEdited, true);
    },
  );

  await t.test(
    "User A deletes message and User B receives message:deleted event in real time",
    async () => {
      const deletePromise = new Promise<any>((resolve) => {
        clientSocketB.on("message:deleted", (data: any) => {
          resolve(data);
        });
      });

      const res = await fetch(
        `${restBaseUrl}/conversations/${conversationId}/messages/${sentMessageId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        },
      );

      assert.equal(res.status, 200);

      const deletedEvent = await deletePromise;
      assert.equal(deletedEvent.conversationId, conversationId);
      assert.equal(deletedEvent.messageId, sentMessageId);
    },
  );

  await t.test(
    "Unauthorized message edit by another user is blocked with 403",
    async () => {
      // User B tries to edit User A's deleted message or any message of user A
      const res = await fetch(
        `${restBaseUrl}/conversations/${conversationId}/messages/${sentMessageId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${memberToken}`,
          },
          body: JSON.stringify({
            content: "Hacked content",
          }),
        },
      );

      // Either 400 (already deleted) or 403 (unauthorized)
      assert.ok(res.status === 400 || res.status === 403);
    },
  );

  await t.test(
    "Non-participant user cannot send messages in the conversation (403)",
    async () => {
      const res = await fetch(
        `${restBaseUrl}/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${thirdUserToken}`,
          },
          body: JSON.stringify({
            content: "Intruder message",
          }),
        },
      );

      assert.equal(res.status, 403);
    },
  );

  await t.test("GET /conversations/:id/messages fetches message history", async () => {
    const res = await fetch(
      `${restBaseUrl}/conversations/${conversationId}/messages`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
    );

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data));
    assert.ok(json.data.length >= 1);
  });
});
