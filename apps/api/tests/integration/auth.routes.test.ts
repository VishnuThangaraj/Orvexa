import test from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import app from "../../src/app.js";
import prisma from "../../src/infrastructure/database/prisma.js";
import env from "../../src/config/env.js";

test("Phase 3: Auth Routes HTTP End-to-End integration", async (t) => {
  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}/api/auth`;

  const testEmail = env.ADMIN_EMAIL;
  const testPassword = env.ADMIN_PASSWORD;

  const admin = await prisma.user.findUnique({ where: { email: testEmail } });
  assert.ok(admin);
  await prisma.userSession.deleteMany({ where: { userId: admin.id } });

  let accessToken = "";
  let refreshToken = "";
  let sessionId = "";

  await t.test("POST /api/auth - Successful Login creates session", async () => {
    const res = await fetch(`${baseUrl}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        deviceName: "HTTP Test Runner",
      }),
    });

    const body = (await res.json()) as {
      success: boolean;
      data: {
        accessToken: string;
        refreshToken: string;
        sessionId: string;
      };
    };

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(body.data.accessToken);
    assert.ok(body.data.refreshToken);
    assert.ok(body.data.sessionId);

    accessToken = body.data.accessToken;
    refreshToken = body.data.refreshToken;
    sessionId = body.data.sessionId;
  });

  await t.test("GET /api/auth/sessions - Protected route lists active sessions", async () => {
    // Without token -> 401
    const unauthRes = await fetch(`${baseUrl}/sessions`);
    assert.equal(unauthRes.status, 401);

    // With Bearer token -> 200
    const res = await fetch(`${baseUrl}/sessions`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-refresh-token": refreshToken,
      },
    });

    const body = (await res.json()) as {
      success: boolean;
      data: Array<{ id: string; deviceName: string; isCurrent: boolean }>;
    };

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(body.data.length >= 1);
    const current = body.data.find((s) => s.id === sessionId);
    assert.ok(current);
    assert.equal(current.isCurrent, true);
    assert.equal(current.deviceName, "HTTP Test Runner");
  });

  await t.test("POST /api/auth/refresh - Rotates refresh token", async () => {
    const oldRefreshToken = refreshToken;

    const res = await fetch(`${baseUrl}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: oldRefreshToken }),
    });

    const body = (await res.json()) as {
      success: boolean;
      data: { accessToken: string; refreshToken: string };
    };

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.notEqual(body.data.refreshToken, oldRefreshToken);

    // Update with new tokens
    accessToken = body.data.accessToken;
    refreshToken = body.data.refreshToken;

    // Old token should be rejected (401)
    const reuseRes = await fetch(`${baseUrl}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: oldRefreshToken }),
    });
    assert.equal(reuseRes.status, 401);
  });

  await t.test("DELETE /api/auth/sessions/:id - Invalid session ID format returns 400", async () => {
    const res = await fetch(`${baseUrl}/sessions/not-a-number`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    assert.equal(res.status, 400);
  });

  await t.test("POST /api/auth/logout - Revokes session", async () => {
    const res = await fetch(`${baseUrl}/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const body = (await res.json()) as { success: boolean; message: string };
    assert.equal(res.status, 200);
    assert.equal(body.success, true);

    // Refreshing should now fail with 401
    const refreshRes = await fetch(`${baseUrl}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    assert.equal(refreshRes.status, 401);
  });

  await t.test("DELETE /api/auth/sessions - Revoke all sessions", async () => {
    // Log in again to create a session
    const loginRes = await fetch(`${baseUrl}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const loginBody = (await loginRes.json()) as {
      data: { accessToken: string; refreshToken: string };
    };

    // Revoke all
    const revokeAllRes = await fetch(`${baseUrl}/sessions`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${loginBody.data.accessToken}` },
    });
    assert.equal(revokeAllRes.status, 200);

    // Refresh should fail
    const refreshRes = await fetch(`${baseUrl}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: loginBody.data.refreshToken }),
    });
    assert.equal(refreshRes.status, 401);
  });

  // Clean up
  await prisma.userSession.deleteMany({ where: { userId: admin.id } });
  server.close();
});
