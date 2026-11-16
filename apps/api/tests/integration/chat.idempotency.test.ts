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

test("Task 6.1: Message Send Idempotency & Socket Rate Limiting Tests", async (t) => {
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
  let conversationId: string | null = null;

  try {
    // Setup test conversation
    const convRes = await fetch(`${restBaseUrl}/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        type: "GROUP",
        name: "Idempotency Test Space",
        participantIds: [String(memberUser.id)],
      }),
    });
    const convJson = await convRes.json();
    assert.equal(convRes.status, 201);
    conversationId = String(convJson.data.id);

    await t.test("1. REST send message with clientMessageId succeeds and stores clientMessageId", async () => {
      const clientMessageId = "client-uuid-001";
      const sendRes = await fetch(`${restBaseUrl}/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          content: "Hello idempotent world!",
          clientMessageId,
        }),
      });

      assert.equal(sendRes.status, 201);
      const sendJson = await sendRes.json();
      assert.equal(sendJson.data.content, "Hello idempotent world!");
      assert.equal(sendJson.data.clientMessageId, clientMessageId);

      // Verify in DB
      const dbMessage = await prisma.chatMessage.findFirst({
        where: {
          conversationId: BigInt(conversationId!),
          clientMessageId,
        },
      });
      assert.ok(dbMessage, "Message must be saved with clientMessageId in database");
      assert.equal(dbMessage.clientMessageId, clientMessageId);
    });

    await t.test("2. Re-sending identical clientMessageId returns original message without creating duplicate row", async () => {
      const clientMessageId = "client-uuid-001";

      const countBefore = await prisma.chatMessage.count({
        where: {
          conversationId: BigInt(conversationId!),
        },
      });

      const retryRes = await fetch(`${restBaseUrl}/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          content: "Hello idempotent world! (Retried)",
          clientMessageId,
        }),
      });

      assert.equal(retryRes.status, 201);
      const retryJson = await retryRes.json();

      // Must return original message content and id
      assert.equal(retryJson.data.content, "Hello idempotent world!");
      assert.equal(retryJson.data.clientMessageId, clientMessageId);

      const countAfter = await prisma.chatMessage.count({
        where: {
          conversationId: BigInt(conversationId!),
        },
      });

      assert.equal(countAfter, countBefore, "Message count must not increase on duplicate send");
    });

    await t.test("3. Socket chat:send with clientMessageId is idempotent and does not create duplicate", async () => {
      clientSocketA = ClientSocket(socketUrl, {
        auth: { token: adminToken },
        transports: ["websocket"],
      });

      await new Promise<void>((resolve) => {
        clientSocketA!.on("connect", () => resolve());
      });

      const clientMessageId = "socket-uuid-002";

      // First send
      const firstSendResult: any = await new Promise((resolve) => {
        clientSocketA!.emit(
          "chat:send",
          {
            conversationId: conversationId!,
            content: "First socket message",
            clientMessageId,
          },
          (res: any) => resolve(res),
        );
      });

      assert.equal(firstSendResult.success, true);
      assert.equal(firstSendResult.data.content, "First socket message");
      const originalId = firstSendResult.data.id;

      // Retry same clientMessageId
      const secondSendResult: any = await new Promise((resolve) => {
        clientSocketA!.emit(
          "chat:send",
          {
            conversationId: conversationId!,
            content: "First socket message (Duplicate)",
            clientMessageId,
          },
          (res: any) => resolve(res),
        );
      });

      assert.equal(secondSendResult.success, true);
      assert.equal(secondSendResult.data.id, originalId);
      assert.equal(secondSendResult.data.content, "First socket message");
    });

    await t.test("4. Socket chat:send rate limiter rejects rapid message floods", async () => {
      assert.ok(clientSocketA, "Socket A must be connected");

      // Send 16 messages in rapid succession (limit is 15 in 3000ms)
      const results: any[] = [];
      for (let i = 0; i < 17; i++) {
        const res: any = await new Promise((resolve) => {
          clientSocketA!.emit(
            "chat:send",
            {
              conversationId: conversationId!,
              content: `Flood test message ${i}`,
            },
            (r: any) => resolve(r),
          );
        });
        results.push(res);
      }

      const rateLimited = results.filter((r) => !r.success && r.error?.includes("Rate limit exceeded"));
      assert.ok(
        rateLimited.length > 0,
        `Expected at least one rate limit rejection, got results: ${JSON.stringify(results.map((r) => r.success))}`,
      );
    });
  } finally {
    if (clientSocketA) clientSocketA.disconnect();
    if (conversationId) {
      await prisma.conversation.delete({
        where: { id: BigInt(conversationId) },
      }).catch(() => {});
    }
    await closeSocketServer();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  }
});
