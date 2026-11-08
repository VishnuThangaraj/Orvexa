import test from "node:test";
import assert from "node:assert/strict";
import AuthRepository from "../../src/modules/auth/auth.repository.js";
import prisma from "../../src/infrastructure/database/prisma.js";
import { hashToken } from "../../src/common/utils/hash.js";

test("Task 1.2: AuthRepository UserSession CRUD operations", async () => {
  const repository = new AuthRepository();

  // Find existing seeded member user (distinct from admin to avoid cross-test interference)
  const user = await repository.findByEmail("vignesh@orvexa.com");
  assert.ok(user, "Seeded member user vignesh@orvexa.com must exist");
  const userId = user.id;

  const rawToken1 = "test-token-step-1-2-alpha";
  const tokenHash1 = hashToken(rawToken1);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // 1. Create session
  const createdSession = await repository.createSession({
    userId,
    refreshTokenHash: tokenHash1,
    expiresAt,
    ipAddress: "127.0.0.1",
    userAgent: "AutomatedTestAgent/1.0",
    deviceName: "Integration Test Device",
  });

  assert.ok(createdSession);
  assert.equal(createdSession.userId, userId);
  assert.equal(createdSession.refreshTokenHash, tokenHash1);
  assert.equal(createdSession.ipAddress, "127.0.0.1");
  assert.equal(createdSession.deviceName, "Integration Test Device");
  assert.equal(createdSession.revokedAt, null);

  // 2. Find active session by hash
  const activeSession = await repository.findActiveSessionByHash(tokenHash1);
  assert.ok(activeSession, "Session should be found as active");
  assert.equal(activeSession.id, createdSession.id);
  assert.equal(activeSession.user.id, userId);

  // 3. Update session token (token rotation)
  const rawToken2 = "test-token-step-1-2-beta";
  const tokenHash2 = hashToken(rawToken2);
  const newExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const updatedSession = await repository.updateSessionToken(
    createdSession.id,
    tokenHash2,
    newExpiresAt,
  );
  assert.equal(updatedSession.refreshTokenHash, tokenHash2);

  // Old hash should no longer return active session
  const oldActive = await repository.findActiveSessionByHash(tokenHash1);
  assert.equal(oldActive, null);

  // New hash should return active session
  const newActive = await repository.findActiveSessionByHash(tokenHash2);
  assert.ok(newActive);
  assert.equal(newActive.id, createdSession.id);

  // 4. Find active sessions for user
  const userSessions = await repository.findActiveSessionsByUserId(userId);
  assert.ok(userSessions.length > 0);
  assert.ok(userSessions.some((s) => s.id === createdSession.id));

  // 5. Revoke session by ID
  const revokeResult = await repository.revokeSessionById(createdSession.id, userId);
  assert.equal(revokeResult.count, 1);

  // Should no longer be active
  const revokedActive = await repository.findActiveSessionByHash(tokenHash2);
  assert.equal(revokedActive, null);

  // Should still be findable by hash for audit/reuse detection
  const historicalSession = await repository.findSessionByHash(tokenHash2);
  assert.ok(historicalSession);
  assert.notEqual(historicalSession.revokedAt, null);

  // Clean up: delete test session
  await prisma.userSession.delete({
    where: { id: createdSession.id },
  });
});
