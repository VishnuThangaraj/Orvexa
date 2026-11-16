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

test("Task 5: Presence, Notifications & Conversation Preferences Integration Tests", async (t) => {
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
  let conversationId: string;

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
        name: "Preferences & Presence Test Space",
        participantIds: [String(memberUser.id)],
      }),
    });
    assert.equal(convRes.status, 201);
    const convJson = (await convRes.json()) as any;
    conversationId = String(convJson.data.id);

    // Connect client A (admin)
    clientSocketA = ClientSocket(socketUrl, {
      auth: { token: adminToken },
      transports: ["websocket"],
    });

    await new Promise<void>((resolve) => clientSocketA!.on("connect", () => resolve()));

    await t.test("1. Connection triggers presence:state broadcast with ACTIVE status", async () => {
      // Connect client B and verify client A receives presence:state for B
      const presencePromise = new Promise<any>((resolve) => {
        clientSocketA!.on("presence:state", (data) => {
          if (String(data.userId) === String(memberUser.id)) {
            resolve(data);
          }
        });
      });

      clientSocketB = ClientSocket(socketUrl, {
        auth: { token: memberToken },
        transports: ["websocket"],
      });

      const presenceData = await presencePromise;
      assert.equal(String(presenceData.userId), String(memberUser.id));
      assert.equal(presenceData.isOnline, true);
      assert.equal(presenceData.status, "ACTIVE");
    });

    await t.test("2. Client presence status transition: ACTIVE -> AWAY -> DND", async () => {
      // Transition to AWAY
      const awayPromise = new Promise<any>((resolve) => {
        clientSocketA!.on("presence:state", (data) => {
          if (String(data.userId) === String(memberUser.id) && data.status === "AWAY") {
            resolve(data);
          }
        });
      });

      clientSocketB!.emit("presence:update", { status: "AWAY" });
      const awayData = await awayPromise;
      assert.equal(awayData.status, "AWAY");
      assert.equal(awayData.isOnline, true);

      // Transition to DND
      const dndPromise = new Promise<any>((resolve) => {
        clientSocketA!.on("presence:state", (data) => {
          if (String(data.userId) === String(memberUser.id) && data.status === "DND") {
            resolve(data);
          }
        });
      });

      clientSocketB!.emit("presence:update", { status: "DND" });
      const dndData = await dndPromise;
      assert.equal(dndData.status, "DND");
      assert.equal(dndData.isOnline, true);
    });

    await t.test("3. GET /api/chat/presence returns online users and presenceMap", async () => {
      const res = await fetch(`${restBaseUrl}/presence`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      const json = (await res.json()) as any;

      assert.ok(Array.isArray(json.data.onlineUserIds));
      assert.ok(json.data.onlineUserIds.includes(String(adminUser.id)));
      assert.ok(json.data.onlineUserIds.includes(String(memberUser.id)));
      assert.ok(json.data.presenceMap);
      assert.equal(json.data.presenceMap[String(memberUser.id)]?.status, "DND");
    });

    await t.test("4. Participant preferences: Star (isPinned) and Mute (isMuted)", async () => {
      // Pin / Star conversation
      const starRes = await fetch(
        `${restBaseUrl}/conversations/${conversationId}/settings`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ isPinned: true, isMuted: true }),
        },
      );
      assert.equal(starRes.status, 200);
      const starJson = (await starRes.json()) as any;
      assert.equal(starJson.data.isPinned, true);
      assert.equal(starJson.data.isMuted, true);

      // Verify persistence across query
      const detailRes = await fetch(
        `${restBaseUrl}/conversations/${conversationId}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );
      assert.equal(detailRes.status, 200);
      const detailJson = (await detailRes.json()) as any;
      const myPart = detailJson.data.participants.find(
        (p: any) => String(p.userId) === String(adminUser.id),
      );
      assert.ok(myPart, "Admin participant must exist");
      assert.equal(myPart.isPinned, true);
      assert.equal(myPart.isMuted, true);
    });

    await t.test("5. Disconnect triggers presence:state broadcast with isOnline: false", async () => {
      const offlinePromise = new Promise<any>((resolve) => {
        clientSocketA!.on("presence:state", (data) => {
          if (String(data.userId) === String(memberUser.id) && data.isOnline === false) {
            resolve(data);
          }
        });
      });

      clientSocketB!.disconnect();
      const offlineData = await offlinePromise;
      assert.equal(offlineData.isOnline, false);
    });
  } finally {
    if (clientSocketA) clientSocketA.disconnect();
    if (clientSocketB && clientSocketB.connected) clientSocketB.disconnect();
    closeSocketServer();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));

    if (conversationId!) {
      await prisma.conversation.delete({
        where: { id: BigInt(conversationId) },
      }).catch(() => {});
    }
  }
});
