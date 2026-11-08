import test from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import app from "../../src/app.js";
import prisma from "../../src/infrastructure/database/prisma.js";
import AuthService from "../../src/modules/auth/auth.service.js";
import { createRateLimiter } from "../../src/middleware/rateLimiter.middleware.js";
import type { Request, Response } from "express";
import AppError from "../../src/common/errors/AppError.js";

test("Security Enhancements: JWT Invalidation, Cookies, Rate Limiting & TTL Pruning", async (t) => {
  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}/api/auth`;

  const memberEmail = "thilakeshwaran@gmail.com";
  const defaultPassword = "orvexa@123";

  const memberUser = await prisma.user.findUnique({
    where: { email: memberEmail },
    include: { credentials: true },
  });
  assert.ok(memberUser);

  // Clean initial state
  await prisma.userSession.deleteMany({ where: { userId: memberUser.id } });
  await prisma.passwordResetToken.deleteMany({ where: { userId: memberUser.id } });

  await t.test("1. HttpOnly cookie set on login and usable for refresh & logout", async () => {
    // Login
    const loginRes = await fetch(`${baseUrl}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: memberEmail, password: defaultPassword }),
    });

    assert.equal(loginRes.status, 200);
    const setCookie = loginRes.headers.get("set-cookie");
    assert.ok(setCookie, "set-cookie header must be present on login");
    assert.match(setCookie, /refreshToken=/);
    assert.match(setCookie, /HttpOnly/i);

    // Extract cookie value
    const match = setCookie.match(/refreshToken=([^;]+)/);
    assert.ok(match);
    const cookieToken = match[1];

    // Refresh using Cookie alone (empty body)
    const refreshRes = await fetch(`${baseUrl}/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `refreshToken=${cookieToken}`,
      },
      body: JSON.stringify({}),
    });

    assert.equal(refreshRes.status, 200);
    const refreshedCookie = refreshRes.headers.get("set-cookie");
    assert.ok(refreshedCookie, "New rotated cookie must be set on refresh");

    // Extract new cookie value
    const newMatch = refreshedCookie.match(/refreshToken=([^;]+)/);
    assert.ok(newMatch);
    const newCookieToken = newMatch[1];
    assert.notEqual(newCookieToken, cookieToken, "Cookie refresh token must be rotated");

    // Logout using Cookie alone
    const logoutRes = await fetch(`${baseUrl}/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `refreshToken=${newCookieToken}`,
      },
      body: JSON.stringify({}),
    });

    assert.equal(logoutRes.status, 200);
    const clearedCookie = logoutRes.headers.get("set-cookie");
    assert.ok(clearedCookie);
    assert.match(clearedCookie, /refreshToken=;/);
  });

  await t.test("2. Immediate JWT Invalidation on password change", async () => {
    // 1. Log in to get an access token
    const loginRes = await fetch(`${baseUrl}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: memberEmail, password: defaultPassword }),
    });
    const loginBody = (await loginRes.json()) as { data: { accessToken: string } };
    const oldAccessToken = loginBody.data.accessToken;

    // Verify token works on protected profile endpoint
    const validProfileRes = await fetch(`${baseUrl}`, {
      headers: { Authorization: `Bearer ${oldAccessToken}` },
    });
    assert.equal(validProfileRes.status, 200);

    // 2. Change password (wait 1 second so passwordChangedAt timestamp is strictly after token iat)
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const changeRes = await fetch(`${baseUrl}/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${oldAccessToken}`,
      },
      body: JSON.stringify({
        currentPassword: defaultPassword,
        newPassword: "UpdatedTemporaryPass123!",
      }),
    });
    assert.equal(changeRes.status, 200);

    // 3. Immediately try to use oldAccessToken on protected profile endpoint
    const rejectedRes = await fetch(`${baseUrl}`, {
      headers: { Authorization: `Bearer ${oldAccessToken}` },
    });

    const rejectedBody = (await rejectedRes.json()) as { success: boolean; message: string };
    assert.equal(rejectedRes.status, 401);
    assert.match(rejectedBody.message, /Token expired due to password change/);

    // 4. Restore original password for clean test state
    const restoreLogin = await fetch(`${baseUrl}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: memberEmail, password: "UpdatedTemporaryPass123!" }),
    });
    const restoreBody = (await restoreLogin.json()) as { data: { accessToken: string } };

    await fetch(`${baseUrl}/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${restoreBody.data.accessToken}`,
      },
      body: JSON.stringify({
        currentPassword: "UpdatedTemporaryPass123!",
        newPassword: defaultPassword,
      }),
    });
  });

  await t.test("3. Sliding window IP Rate Limiter blocks excessive requests", async () => {
    const limiter = createRateLimiter({
      windowMs: 1000,
      max: 3,
      message: "Rate limit exceeded",
    });

    const mockReq = {
      headers: {},
      socket: { remoteAddress: "198.51.100.1" },
    } as unknown as Request;

    const mockRes = {
      setHeader: () => {},
    } as unknown as Response;

    // Requests 1-3 should pass
    for (let i = 1; i <= 3; i++) {
      let passed = false;
      limiter(mockReq, mockRes, (err) => {
        assert.equal(err, undefined);
        passed = true;
      });
      assert.equal(passed, true);
    }

    // Request 4 should be rejected with 429
    let rejectedError: unknown;
    limiter(mockReq, mockRes, (err) => {
      rejectedError = err;
    });

    assert.ok(rejectedError instanceof AppError);
    assert.equal(rejectedError.statusCode, 429);
    assert.equal(rejectedError.message, "Rate limit exceeded");
  });

  await t.test("4. Session pruning deletes expired and revoked sessions older than threshold", async () => {
    const authService = new AuthService();

    // Create an old expired session (> 35 days old)
    const oldDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
    const staleSession = await prisma.userSession.create({
      data: {
        userId: memberUser.id,
        refreshTokenHash: "stale-session-hash-12345",
        expiresAt: oldDate,
        createdAt: oldDate,
      },
    });

    // Prune sessions older than 30 days
    const result = await authService.pruneExpiredSessions(30);
    assert.ok(result.deletedCount >= 1);

    // Verify staleSession is gone
    const checkSession = await prisma.userSession.findUnique({
      where: { id: staleSession.id },
    });
    assert.equal(checkSession, null);
  });

  // Final cleanup
  await prisma.userSession.deleteMany({ where: { userId: memberUser.id } });
  server.close();
});
