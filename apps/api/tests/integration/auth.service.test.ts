import test from "node:test";
import assert from "node:assert/strict";
import AuthService from "../../src/modules/auth/auth.service.js";
import prisma from "../../src/infrastructure/database/prisma.js";
import AppError from "../../src/common/errors/AppError.js";
import env from "../../src/config/env.js";
import { hashToken } from "../../src/common/utils/hash.js";

test("Phase 2: AuthService session lifecycle, rotation, and revocation", async (t) => {
  const authService = new AuthService();

  const testEmail = env.ADMIN_EMAIL;
  const testPassword = env.ADMIN_PASSWORD;

  // Clean any pre-existing sessions for this test user
  const adminUser = await prisma.user.findUnique({ where: { email: testEmail } });
  assert.ok(adminUser, "Admin user must exist");
  await prisma.userSession.deleteMany({ where: { userId: adminUser.id } });

  let session1Tokens: { accessToken: string; refreshToken: string; sessionId?: string };
  let session2Tokens: { accessToken: string; refreshToken: string; sessionId?: string };

  await t.test("Task 2.1: Login creates user session in DB with metadata", async () => {
    const loginResult = await authService.userLogin({
      email: testEmail,
      password: testPassword,
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Macintosh)",
      deviceName: "MacBook Pro",
    });

    assert.ok(loginResult.accessToken);
    assert.ok(loginResult.refreshToken);
    assert.ok(loginResult.sessionId);
    assert.equal(loginResult.user.email, testEmail);

    session1Tokens = loginResult;

    // Verify session is recorded in DB
    const dbSession = await prisma.userSession.findUnique({
      where: { id: BigInt(loginResult.sessionId) },
    });

    assert.ok(dbSession, "Session record must exist in DB");
    assert.equal(dbSession.userId, adminUser.id);
    assert.equal(dbSession.ipAddress, "192.168.1.100");
    assert.equal(dbSession.userAgent, "Mozilla/5.0 (Macintosh)");
    assert.equal(dbSession.deviceName, "MacBook Pro");
    assert.equal(dbSession.refreshTokenHash, hashToken(loginResult.refreshToken));
    assert.equal(dbSession.revokedAt, null);
    assert.ok(dbSession.expiresAt > new Date());
  });

  await t.test("Task 2.2: Token refresh rotates tokens and invalidates previous token", async () => {
    const oldRefreshToken = session1Tokens.refreshToken;
    const oldHash = hashToken(oldRefreshToken);

    // Perform refresh
    const refreshed = await authService.refreshToken({ refreshToken: oldRefreshToken });

    assert.ok(refreshed.accessToken);
    assert.ok(refreshed.refreshToken);
    assert.notEqual(refreshed.refreshToken, oldRefreshToken, "Refresh token must be rotated");

    // Verify database has the new hash
    const dbSession = await prisma.userSession.findUnique({
      where: { id: BigInt(session1Tokens.sessionId!) },
    });
    assert.ok(dbSession);
    assert.equal(dbSession.refreshTokenHash, hashToken(refreshed.refreshToken));
    assert.notEqual(dbSession.refreshTokenHash, oldHash);

    // Update session1Tokens with latest refresh token
    session1Tokens.refreshToken = refreshed.refreshToken;
    session1Tokens.accessToken = refreshed.accessToken;

    // Attempting to reuse old refresh token must be rejected (Token Reuse Prevention)
    await assert.rejects(
      async () => {
        await authService.refreshToken({ refreshToken: oldRefreshToken });
      },
      (err: unknown) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.statusCode, 401);
        return true;
      },
      "Reusing rotated token must fail with 401",
    );
  });

  await t.test("Task 2.3: Multiple active sessions and getActiveSessions", async () => {
    // Create a second session from another device
    const login2Result = await authService.userLogin({
      email: testEmail,
      password: testPassword,
      ipAddress: "10.0.0.5",
      userAgent: "Mobile Safari",
      deviceName: "iPhone 15",
    });

    session2Tokens = login2Result;

    // Get active sessions
    const activeSessions = await authService.getActiveSessions(
      adminUser.id,
      session2Tokens.refreshToken,
    );

    assert.equal(activeSessions.length, 2, "Should have 2 active sessions");

    const currentSession = activeSessions.find((s) => s.isCurrent);
    assert.ok(currentSession);
    assert.equal(currentSession.id, session2Tokens.sessionId);
    assert.equal(currentSession.deviceName, "iPhone 15");

    const otherSession = activeSessions.find((s) => !s.isCurrent);
    assert.ok(otherSession);
    assert.equal(otherSession.id, session1Tokens.sessionId);
  });

  await t.test("Task 2.3: Revoke specific session (Device 1) and verify Device 2 stays active", async () => {
    // Revoke Session 1
    await authService.revokeSession(adminUser.id, BigInt(session1Tokens.sessionId!));

    // Refreshing Session 1 must fail
    await assert.rejects(
      async () => {
        await authService.refreshToken({ refreshToken: session1Tokens.refreshToken });
      },
      (err: unknown) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.statusCode, 401);
        return true;
      },
    );

    // Session 2 should still be completely valid
    const session2Refresh = await authService.refreshToken({
      refreshToken: session2Tokens.refreshToken,
    });
    assert.ok(session2Refresh.accessToken);
    session2Tokens.refreshToken = session2Refresh.refreshToken;

    // Revoking an already revoked session or nonexistent session should return 404
    await assert.rejects(
      async () => {
        await authService.revokeSession(adminUser.id, BigInt(session1Tokens.sessionId!));
      },
      (err: unknown) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.statusCode, 404);
        return true;
      },
    );
  });

  await t.test("Task 2.3: Logout current session", async () => {
    // Logout Session 2
    await authService.logout(session2Tokens.refreshToken);

    // Refreshing Session 2 must fail now
    await assert.rejects(
      async () => {
        await authService.refreshToken({ refreshToken: session2Tokens.refreshToken });
      },
      (err: unknown) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.statusCode, 401);
        return true;
      },
    );

    // Active sessions should be 0 now
    const active = await authService.getActiveSessions(adminUser.id);
    assert.equal(active.length, 0);
  });

  await t.test("Task 2.3: Revoke all sessions (Logout all devices)", async () => {
    // Create 3 sessions
    const s1 = await authService.userLogin({ email: testEmail, password: testPassword });
    const s2 = await authService.userLogin({ email: testEmail, password: testPassword });
    const s3 = await authService.userLogin({ email: testEmail, password: testPassword });

    let active = await authService.getActiveSessions(adminUser.id);
    assert.equal(active.length, 3);

    // Revoke all
    await authService.revokeAllSessions(adminUser.id);

    active = await authService.getActiveSessions(adminUser.id);
    assert.equal(active.length, 0);

    // None can refresh
    for (const s of [s1, s2, s3]) {
      await assert.rejects(
        async () => {
          await authService.refreshToken({ refreshToken: s.refreshToken });
        },
        (err: unknown) => {
          assert.ok(err instanceof AppError);
          assert.equal(err.statusCode, 401);
          return true;
        },
      );
    }
  });

  // Clean up
  await prisma.userSession.deleteMany({ where: { userId: adminUser.id } });
});
