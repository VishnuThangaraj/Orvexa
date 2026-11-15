import test from "node:test";
import assert from "node:assert/strict";
import { socketAuthMiddleware } from "../../src/sockets/socket.middleware.js";
import { generateAccessToken } from "../../src/common/utils/jwt.js";
import prisma from "../../src/infrastructure/database/prisma.js";
import env from "../../src/config/env.js";
import type { AuthenticatedSocket } from "../../src/sockets/socket.types.js";

test("WebSocket Handshake Authentication Middleware Unit Tests", async (t) => {
  const adminUser = await prisma.user.findUnique({
    where: { email: env.ADMIN_EMAIL },
  });
  assert.ok(adminUser, "Admin user should exist in DB");

  await t.test("Rejects handshake with missing token", (t, done) => {
    const mockSocket = {
      handshake: {
        auth: {},
        headers: {},
      },
      data: {},
    } as unknown as AuthenticatedSocket;

    socketAuthMiddleware(mockSocket, (err) => {
      assert.ok(err);
      assert.equal(err?.message, "Authentication required");
      done();
    });
  });

  await t.test("Rejects handshake with invalid JWT string", (t, done) => {
    const mockSocket = {
      handshake: {
        auth: { token: "malformed.jwt.token" },
        headers: {},
      },
      data: {},
    } as unknown as AuthenticatedSocket;

    socketAuthMiddleware(mockSocket, (err) => {
      assert.ok(err);
      assert.equal(err?.message, "Invalid or Expired Token");
      done();
    });
  });

  await t.test("Rejects handshake for non-existent user", (t, done) => {
    const fakeToken = generateAccessToken({
      id: "999999999999",
      role: "MEMBER",
    });

    const mockSocket = {
      handshake: {
        auth: { token: fakeToken },
        headers: {},
      },
      data: {},
    } as unknown as AuthenticatedSocket;

    socketAuthMiddleware(mockSocket, (err) => {
      assert.ok(err);
      assert.equal(err?.message, "User account is inactive or not found");
      done();
    });
  });

  await t.test("Accepts handshake with valid token via auth payload", (t, done) => {
    const validToken = generateAccessToken({
      id: adminUser.id,
      role: adminUser.role,
    });

    const mockSocket = {
      handshake: {
        auth: { token: validToken },
        headers: {},
      },
      data: {},
    } as unknown as AuthenticatedSocket;

    socketAuthMiddleware(mockSocket, (err) => {
      assert.equal(err, undefined);
      assert.equal(mockSocket.data.user.id, String(adminUser.id));
      assert.equal(mockSocket.data.user.role, adminUser.role);
      done();
    });
  });

  await t.test(
    "Accepts handshake with valid token via Authorization header",
    (t, done) => {
      const validToken = generateAccessToken({
        id: adminUser.id,
        role: adminUser.role,
      });

      const mockSocket = {
        handshake: {
          auth: {},
          headers: {
            authorization: `Bearer ${validToken}`,
          },
        },
        data: {},
      } as unknown as AuthenticatedSocket;

      socketAuthMiddleware(mockSocket, (err) => {
        assert.equal(err, undefined);
        assert.equal(mockSocket.data.user.id, String(adminUser.id));
        assert.equal(mockSocket.data.user.role, adminUser.role);
        done();
      });
    },
  );
});
