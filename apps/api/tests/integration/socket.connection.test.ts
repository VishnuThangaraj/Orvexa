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

test("WebSocket Real-Time Connection & Handshake Integration Tests", async (t) => {
  const adminUser = await prisma.user.findUnique({
    where: { email: env.ADMIN_EMAIL },
  });
  assert.ok(adminUser, "Admin user should exist in DB");

  const validToken = generateAccessToken({
    id: adminUser.id,
    role: adminUser.role,
  });

  const httpServer = http.createServer(app);
  const ioServer = initializeSocketServer(httpServer);

  await new Promise<void>((resolve) => {
    httpServer.listen(0, () => resolve());
  });

  const port = (httpServer.address() as AddressInfo).port;
  const socketUrl = `http://127.0.0.1:${port}`;

  t.after(async () => {
    await closeSocketServer();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  await t.test(
    "Authenticated client connects, handshakes successfully, and joins user room",
    async () => {
      const clientSocket: ClientSocketType = ClientSocket(socketUrl, {
        auth: { token: validToken },
        transports: ["websocket"],
        forceNew: true,
      });

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          clientSocket.disconnect();
          reject(new Error("Connection timed out"));
        }, 5000);

        clientSocket.on("connect", () => {
          clearTimeout(timeout);
          assert.equal(clientSocket.connected, true);

          // Verify server socket state
          const serverSockets = Array.from(ioServer.sockets.sockets.values());
          const matchingSocket = serverSockets.find(
            (s) => s.id === clientSocket.id,
          );
          assert.ok(matchingSocket, "Server socket must exist");
          assert.equal(matchingSocket.data.user?.id, String(adminUser.id));

          // Verify user room membership
          const personalRoom = `user:${adminUser.id}`;
          assert.ok(
            matchingSocket.rooms.has(personalRoom),
            `Socket must be in room ${personalRoom}`,
          );

          clientSocket.disconnect();
          resolve();
        });

        clientSocket.on("connect_error", (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    },
  );

  await t.test(
    "Unauthenticated client is rejected during handshake",
    async () => {
      const clientSocket: ClientSocketType = ClientSocket(socketUrl, {
        auth: {},
        transports: ["websocket"],
        forceNew: true,
      });

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          clientSocket.disconnect();
          reject(new Error("Expected connect_error was not fired within timeout"));
        }, 5000);

        clientSocket.on("connect", () => {
          clearTimeout(timeout);
          clientSocket.disconnect();
          reject(new Error("Connection should not have succeeded without token"));
        });

        clientSocket.on("connect_error", (err) => {
          clearTimeout(timeout);
          assert.equal(err.message, "Authentication required");
          clientSocket.disconnect();
          resolve();
        });
      });
    },
  );

  await t.test(
    "Client with invalid token is rejected during handshake",
    async () => {
      const clientSocket: ClientSocketType = ClientSocket(socketUrl, {
        auth: { token: "bad.jwt.token" },
        transports: ["websocket"],
        forceNew: true,
      });

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          clientSocket.disconnect();
          reject(new Error("Expected connect_error was not fired within timeout"));
        }, 5000);

        clientSocket.on("connect", () => {
          clearTimeout(timeout);
          clientSocket.disconnect();
          reject(new Error("Connection should not have succeeded with invalid token"));
        });

        clientSocket.on("connect_error", (err) => {
          clearTimeout(timeout);
          assert.equal(err.message, "Invalid or Expired Token");
          clientSocket.disconnect();
          resolve();
        });
      });
    },
  );
});
